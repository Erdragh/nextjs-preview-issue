import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import React from "react";

export default function Page({ text }) {
  console.log(text);
  return <Link href="/test/">Test</Link>;
}

export const getStaticPaths: GetStaticPaths = (context) => {
  return {
    paths: [
      {
        params: {
          path: ["test", "hi"],
        },
      },
    ],
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = (context) => {
  console.log(context);
  return {
    props: {
      text: context.preview ? {
        test: "hi"
      } : {
        test: "hello"
      }
    }
  }
}