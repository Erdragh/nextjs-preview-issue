This is a minimal example to reproduce the following issue I have found with NextJS' preview mode:

### TL;DR:
When in preview mode and using a wildcard page (`[[...path]].tsx`), NextJS still tries to prefetch every page that is linked to. However, what happens is that it calls `getStaticProps` for every page that is linked to, even if it doesn't exist within what was outlined by `getStaticPaths`. While this could be intended behavior to allow you to preview pages that are not yet registered by `getStaticPaths`, it still presents a question:

> Wouldn't it be better to also call `getStaticPaths` when in preview mode? In that case it would probably also be good to let `getStaticPaths` know whether it is in preview mode.

## Description

I will describe how I personally understand NextJS' processes to work, if anything is wrong or I misunderstood something, please tell me so.

When using a wildcard page (`[[...path]].tsx`) the following happens when accessing a page:

| in dev mode                                                                                                                                    | in production mode                                                                                              | in preview mode                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| If the given path exists either in the folder structure or in what `getStaticPaths` returns, call `getStaticProps` for that page and render it | If the given path exists in the exported static sites, give it to the browser, if it doesn't, respond with 404. | Call `getStaticProps` for the given path no matter if it exists in the folder structure or in `getStaticPaths` |

While it is possible that this is intended behavior to allow the preview of pages not yet registered by `getStaticPaths`, it does present an issue. As an example, let's take a look at the following problem:

> What if a user links to the non-existing page and intends to create it afterwards and therefore it doesn't exist yet? Also what if a part of the path is just supposed to be a separator (e.g. "/articles/" in "/articles/2022-01-22_test")?

You could make an argument that you could check whether the page exists and disable prefetch based on that, however:

- This doesn't solve the original issue, because you would somehow need to check whether it exists, but `getStaticPaths` is not (as far as I know) called in preview mode.
- To quote the documentation for `next/link`:
  > `prefetch` - Prefetch the page in the background. Defaults to `true`. Any `<Link />` that is in the viewport (initially or through scroll) will be preloaded. Prefetch can be disabled by passing `prefetch={false}`. When `prefetch` is set to `false`, prefetching will still occur on hover. Pages using Static Generation will preload `JSON` files with the data for faster page transitions. Prefetching is only enabled in production.

  More specifically:
  > When `prefetch` is set to `false`, prefetching will still occur on hover.

  This means that prefetching is never truly disabled

You could also go ahead and handle the case that data for a page doesn't exist in `getStaticProps`, but, in my personal opinion, this is to late of a point to handle the "What-If" of a page not existing, as it should only really be called for paths that exist in `getStaticPaths`.

Another argument is that in preview mode, `getStaticProps` is called every time you access a page. This means that you already send a request to wherever you get your data from. This also means that wherever the data is coming from, already needs to know the page exists, therefore a potential call to `getStaticPaths` should get the updated paths.

I apologize if it is indeed intended behavior or if I misunderstood something. I also understand that in perfect conditions, this shouldn't be an issue because there shouldn't be any links to non-existing pages, however, perfect conditions don't always apply.

## Reproduction:

1. Clone this repository
2. install packages, build the project and start it:
    ```
    npm install && npm run build && npm run start
    ```
3. Go to [localhost:3000/test/hi](localhost:3000/test/hi), where you will see nothing but a `<Link />` to [localhost:3000/test/](localhost:3000/test/). Opening the console will reveal a 404 not found, because the latter page doesn't exist. This is ok, as it is just a failed request.
4. Go to [localhost:3000/api/hello](localhost:3000/api/hello) to get the preview mode cookie
5. Go to [localhost:3000/test/hi](localhost:3000/test/hi) again. Opening the browser console will reveal that this time, there was no failed request. However, taking a look at the console output of the running node server will reveal the following: 
    ```typescript
    {
      params: { path: [ 'test', 'hi' ] },
      preview: true,
      previewData: {},
      locales: undefined,
      locale: undefined,
      defaultLocale: undefined
    }
    { test: 'hi' }
    {
      params: { path: [ 'test' ] },
      preview: true,
      previewData: {},
      locales: undefined,
      locale: undefined,
      defaultLocale: undefined
    }
    { test: 'hi' }
    ```
    What does this mean? That there were two times the `getStaticProps` method was called, once for the actual page ("/test/hi") and once for the (non-existing) linked to page ("/test/"). Whereas previously, during the build stage, this console output reveals that there was only one time that `getStaticProps` was called:
    ```typescript
    > wildcard-test@0.1.0 build
    > next build

    info  - Linting and checking validity of types  
    info  - Creating an optimized production build  
    info  - Compiled successfully
    info  - Collecting page data  
    [    ] info  - Generating static pages (0/3){
      params: { path: [ 'test', 'hi' ] },
      locales: undefined,
      locale: undefined,
      defaultLocale: undefined
    }
    { test: 'hello' }
    info  - Generating static pages (3/3)
    info  - Finalizing page optimization
    ```

**TL;DR** [on top](#tldr).