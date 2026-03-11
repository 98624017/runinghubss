import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

const productLinks = [
  { label: "一键彩平", href: "/workspace" },
  { label: "外观迁移", href: "/workspace" },
  { label: "平面转效果", href: "/workspace" },
  { label: "毛坯转效果", href: "/workspace" },
];

const supportLinks = [
  { label: "使用教程", href: "#" },
  { label: "常见问题", href: "#" },
  { label: "联系我们", href: "#" },
  { label: "用户协议", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/10 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 品牌区 */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Image src="/images/logo.png" alt="悦安居" width={28} height={28} className="rounded" />
              <span className="text-lg font-bold text-white">悦安居</span>
            </Link>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
              AI 赋能室内设计，从 CAD 平面图到精美效果图，让设计更高效。
            </p>
          </div>

          {/* 产品栏 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">产品</h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 支持栏 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">支持</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} 悦安居 · 家装软装自动出图平台</p>
          <p>ICP备XXXXXXXX号</p>
        </div>
      </div>
    </footer>
  );
}
