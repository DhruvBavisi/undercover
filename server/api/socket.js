// This file is needed for Vercel to properly handle Socket.io
export default function handler(req, res) {
  res.status(200).end();
}
