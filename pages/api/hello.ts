// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiResponse } from "next";

export default function handler(req, res: NextApiResponse) {
  res.setPreviewData({});
  res.end("hi");
}
