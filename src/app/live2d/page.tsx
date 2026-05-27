"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Cat } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";

export default function Live2DPage() {
  return (
    <PageShell
      eyebrow="Live2D"
      title="Live2D"
      description="这里先保留为空页面。之后需要模型时，再按参考站逻辑接入模型资源。"
      actions={<Link href="/" className="rounded-full bg-white/55 px-4 py-2 text-sm"><ArrowLeft className="mr-1 inline h-4 w-4" />回首页</Link>}
    >
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="card grid min-h-[520px] place-items-center p-8 text-center">
        <div>
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white/55 text-[var(--color-brand)]">
            <Cat className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <h2 className="font-averia mt-6 text-3xl">Model later</h2>
          <p className="text-secondary mt-3 max-w-md text-sm leading-7">
            头像入口已经指向这里；当前版本暂时不加载模型，只保留干净的承载页。
          </p>
        </div>
      </motion.div>
    </PageShell>
  );
}
