import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-screen max-w-xl place-items-center px-5 text-center">
      <div className="card p-8">
        <div className="font-averia text-4xl">Page not found</div>
        <p className="text-secondary mt-3 text-sm leading-7">这个页面暂时没有内容。</p>
        <Link href="/" className="brand-btn mt-6 inline-flex h-10 items-center px-4 text-sm">回首页</Link>
      </div>
    </div>
  );
}
