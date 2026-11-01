// Figma reference (React+Tailwind, get_design_context) — node 657:27
<cursor_untrusted_data_1337 source="CallDynamicTool">

const imgLogoKieksMeRed = "../assets/652-3_navigation__imgLogoKieksMeRed.svg" /* gleiches Logo, 34px hoch */;

export default function Navigation() {
  return (
    <div className="bg-[var(--surface,white)] border-[var(--ink,#1e2a45)] border-b-4 border-solid content-stretch flex items-center justify-between px-[20px] py-[14px] relative size-full" data-node-id="657:27" data-name="Navigation">
      <div className="h-[34px] relative shrink-0 w-[173.716px]" data-node-id="657:28" data-name="Logo kieks.me (red)">
        <div className="absolute inset-[0_0_-5.09%_-0.5%]">
          <img alt="" className="block max-w-none size-full" src={imgLogoKieksMeRed} />
        </div>
      </div>
      <div className="bg-[var(--pop\/yellow,#ffd60a)] border-3 border-[var(--ink,#1e2a45)] border-solid content-stretch flex items-start overflow-clip px-[12px] py-[8px] relative shadow-[4px_4px_0px_0px_#ff008f] shrink-0" data-node-id="657:39" data-name="Menü">
        <p className="[word-break:break-word] font-['Hanken_Grotesk:Black'] font-black leading-[normal] relative shrink-0 text-[18px] text-[color:var(--pop\/navy,#1e2a45)] whitespace-nowrap" data-node-id="657:40">
          menü
        </p>
      </div>
    </div>
  );
}
