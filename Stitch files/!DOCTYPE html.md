**<!DOCTYPE html>**

**<html class="dark" lang="en"><head>**

**<meta charset="utf-8"/>**

**<meta content="width=device-width, initial-scale=1.0" name="viewport"/>**

**<title>Smart Position Size \&amp; Risk Calculator</title>**

**<script src="https://cdn.tailwindcss.com?plugins=forms,typography,container-queries"></script>**

**<link href="https://fonts.googleapis.com" rel="preconnect"/>**

**<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>**

**<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700\&amp;family=Space+Grotesk:wght@400;600;700\&amp;display=swap" rel="stylesheet"/>**

**<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1\&amp;display=swap" rel="stylesheet"/>**

**<style type="text/tailwindcss">**

        **:root {**

            **--obsidian-base: #08090a;**

            **--obsidian-gloss: rgba(255, 255, 255, 0.03);**

            **--primary-neon: #00FF9D;**

            **--input-glow: rgba(0, 255, 157, 0.05);**

            **--led-spill: rgba(0, 255, 157, 0.15);**

        **}**

        **@layer base {**

            **body {**

                **@apply bg-\[#040506] font-display text-gray-400 min-h-screen;**

                **background-image: radial-gradient(circle at 50% 0%, #1a1c1e 0%, #040506 100%);**

            **}**

        **}**

        **.obsidian-chassis {**

            **background: linear-gradient(145deg, #121417, #08090a);**

            **box-shadow:** 

                **0 20px 50px rgba(0,0,0,0.5),**

                **inset 0 1px 2px rgba(255,255,255,0.05),**

                **inset 0 -1px 2px rgba(0,0,0,0.8);**

            **border: 1px solid rgba(255,255,255,0.02);**

        **}**

        **.chamfered-edge {**

            **clip-path: polygon(**

                **20px 0%, calc(100% - 20px) 0%, 100% 20px,** 

                **100% calc(100% - 20px), calc(100% - 20px) 100%,** 

                **20px 100%, 0% calc(100% - 20px), 0% 20px**

            **);**

            **position: relative;**

        **}**

        **.chamfered-edge::after {**

            **content: '';**

            **position: absolute;**

            **inset: 0;**

            **border: 2px solid rgba(255,255,255,0.05);**

            **pointer-events: none;**

            **clip-path: inherit;**

        **}**

        **.glass-panel-grid {**

            **background: radial-gradient(circle at center, #0a0b0c 0%, #050607 100%);**

            **position: relative;**

        **}**

        **.glass-panel-grid::before {**

            **content: "";**

            **position: absolute;**

            **inset: 0;**

            **background-image: linear-gradient(rgba(0, 255, 157, 0.03) 1px, transparent 1px),**

                              **linear-gradient(90deg, rgba(0, 255, 157, 0.03) 1px, transparent 1px);**

            **background-size: 4px 4px;**

            **pointer-events: none;**

            **opacity: 0.5;**

        **}**

        **.input-glow-container {**

            **box-shadow: inset 0 0 15px var(--input-glow);**

            **background: rgba(0, 0, 0, 0.3);**

            **border: 1px solid rgba(255, 255, 255, 0.05);**

        **}**

        **.market-plate {**

            **background: linear-gradient(180deg, #1a1c1e, #0d0e10);**

            **box-shadow:** 

                **inset 0 2px 4px rgba(0,0,0,0.8),**

                **0 1px 0 rgba(255,255,255,0.05);**

            **border: 1px solid rgba(0,0,0,0.5);**

            **transition: all 0.3s ease;**

        **}**

        **.market-plate.active {**

            **background: linear-gradient(180deg, #111214, #08090a);**

            **box-shadow:** 

                **inset 0 4px 8px rgba(0,0,0,0.9),**

                **0 0 15px rgba(0, 255, 157, 0.1);**

            **border: 1px solid rgba(0, 255, 157, 0.3);**

        **}**

        **.market-plate.active .glow-dot {**

            **box-shadow: 0 0 12px 2px var(--primary-neon);**

            **background-color: var(--primary-neon);**

        **}**

        **input\[type=range] {**

            **-webkit-appearance: none;**

            **width: 100%;**

            **background: transparent;**

        **}**

        **input\[type=range]::-webkit-slider-thumb {**

            **-webkit-appearance: none;**

            **height: 24px;**

            **width: 16px;**

            **border-radius: 2px;**

            **background: linear-gradient(to bottom, #4a4a4a, #1a1a1a);**

            **border: 1px solid #000;**

            **box-shadow: 0 2px 4px rgba(0,0,0,0.5);**

            **cursor: pointer;**

            **margin-top: -8px;** 

        **}**

        **input\[type=range]::-webkit-slider-runnable-track {**

            **width: 100%;**

            **height: 6px;**

            **cursor: pointer;**

            **background: #0d0e10;**

            **border-radius: 10px;**

            **box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);**

        **}**

    **</style>**

**<script>**

        **tailwind.config = {**

            **darkMode: "class",**

            **theme: {**

                **extend: {**

                    **colors: {**

                        **primary: "#00FF9D",**

                        **obsidian: "#08090a",**

                        **panel: "#121417"**

                    **},**

                    **fontFamily: {**

                        **display: \["'Space Grotesk'", "sans-serif"],**

                        **mono: \["'JetBrains Mono'", "monospace"],**

                    **}**

                **}**

            **}**

        **};**

    **</script>**

**</head>**

**<body class="p-4 md:p-8">**

**<header class="max-w-6xl mx-auto flex justify-end items-center gap-6 mb-12">**

**<button class="w-10 h-10 rounded-full flex items-center justify-center obsidian-chassis text-gray-500 hover:text-primary transition-colors">**

**<span class="material-symbols-outlined text-xl">forum</span>**

**</button>**

**<div class="flex items-center gap-3 obsidian-chassis px-4 py-2 rounded-lg cursor-pointer">**

**<span class="font-mono text-xs font-bold tracking-widest text-gray-400">USD</span>**

**<span class="material-symbols-outlined text-sm">keyboard\_arrow\_down</span>**

**</div>**

**<button class="w-10 h-10 rounded-full flex items-center justify-center obsidian-chassis text-gray-500 hover:text-primary transition-colors">**

**<span class="material-symbols-outlined text-xl">light\_mode</span>**

**</button>**

**</header>**

**<main class="max-w-6xl mx-auto">**

**<div class="text-center mb-12">**

**<h1 class="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tighter">**

                **Smart Position Size \&amp; Risk Calculator**

            **</h1>**

**<p class="text-gray-500 font-medium tracking-wide">Professional grade trade orchestration</p>**

**</div>**

**<div class="w-full max-w-4xl mx-auto mb-10 grid grid-cols-4 gap-3 p-2 bg-\[#050607] rounded-xl shadow-\[inset\_0\_2px\_10px\_rgba(0,0,0,0.5)]">**

**<button class="market-plate py-4 rounded-lg flex flex-col items-center gap-2">**

**<span class="text-\[10px] font-bold uppercase tracking-\[0.2em] text-gray-500">Forex</span>**

**<div class="w-1 h-1 rounded-full bg-gray-700 glow-dot"></div>**

**</button>**

**<button class="market-plate py-4 rounded-lg flex flex-col items-center gap-2">**

**<span class="text-\[10px] font-bold uppercase tracking-\[0.2em] text-gray-500">Stocks</span>**

**<div class="w-1 h-1 rounded-full bg-gray-700 glow-dot"></div>**

**</button>**

**<button class="market-plate active py-4 rounded-lg flex flex-col items-center gap-2">**

**<span class="text-\[10px] font-bold uppercase tracking-\[0.2em] text-primary">Crypto</span>**

**<div class="w-1 h-1 rounded-full glow-dot"></div>**

**</button>**

**<button class="market-plate py-4 rounded-lg flex flex-col items-center gap-2">**

**<span class="text-\[10px] font-bold uppercase tracking-\[0.2em] text-gray-500">Futures</span>**

**<div class="w-1 h-1 rounded-full bg-gray-700 glow-dot"></div>**

**</button>**

**</div>**

**<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">**

**<div class="lg:col-span-6 obsidian-chassis p-1 rounded-\[2rem] relative">**

**<div class="bg-panel rounded-\[1.8rem] p-8 h-full border border-white/5 shadow-2xl relative overflow-hidden">**

**<div class="absolute top-6 left-6 w-1.5 h-1.5 rounded-full bg-black shadow-\[inset\_0\_1px\_1px\_rgba(255,255,255,0.1)]"></div>**

**<div class="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-black shadow-\[inset\_0\_1px\_1px\_rgba(255,255,255,0.1)]"></div>**

**<div class="absolute bottom-6 left-6 w-1.5 h-1.5 rounded-full bg-black shadow-\[inset\_0\_1px\_1px\_rgba(255,255,255,0.1)]"></div>**

**<div class="absolute bottom-6 right-6 w-1.5 h-1.5 rounded-full bg-black shadow-\[inset\_0\_1px\_1px\_rgba(255,255,255,0.1)]"></div>**

**<div class="flex items-center justify-between mb-10 pb-4 border-b border-white/5">**

**<h2 class="text-xl font-bold text-white tracking-tight uppercase text-xs opacity-50">Setup Modules</h2>**

**<span class="text-\[10px] font-mono text-primary opacity-60">SYSTEM READY</span>**

**</div>**

**<div class="space-y-8">**

**<div class="space-y-2">**

**<label class="block text-\[10px] font-bold uppercase tracking-\[0.15em] text-gray-500 ml-1">Account Balance ($)</label>**

**<div class="input-glow-container rounded-lg px-4 py-3 flex items-center justify-between">**

**<span class="text-primary/20 font-mono text-lg">$</span>**

**<input class="bg-transparent border-none text-right font-mono text-xl text-white focus:ring-0 w-full outline-none" type="text" value="750,000"/>**

**</div>**

**</div>**

**<div class="space-y-2">**

**<div class="flex justify-between items-center px-1">**

**<label class="text-\[10px] font-bold uppercase tracking-\[0.15em] text-gray-500">Risk Factor</label>**

**<div class="flex gap-2 p-1 bg-black/40 rounded-md border border-white/5">**

**<button class="px-2 py-0.5 text-\[9px] rounded bg-white/5 text-gray-300">$</button>**

**<button class="px-2 py-0.5 text-\[9px] rounded bg-primary text-black font-bold">%</button>**

**</div>**

**</div>**

**<div class="input-glow-container rounded-lg px-4 py-3 flex items-center justify-between">**

**<input class="bg-transparent border-none text-left font-mono text-xl text-white focus:ring-0 w-full outline-none" type="text" value="1.50"/>**

**<span class="text-primary/20 font-mono text-lg">%</span>**

**</div>**

**</div>**

**<div class="grid grid-cols-2 gap-4">**

**<div class="space-y-2">**

**<label class="block text-\[10px] font-bold uppercase tracking-\[0.15em] text-gray-500 ml-1">Entry Price</label>**

**<div class="input-glow-container rounded-lg px-4 py-3">**

**<input class="bg-transparent border-none text-right font-mono text-sm text-white focus:ring-0 w-full outline-none" type="text" value="66112.60"/>**

**</div>**

**</div>**

**<div class="space-y-2">**

**<label class="block text-\[10px] font-bold uppercase tracking-\[0.15em] text-danger/80 ml-1">Stop Loss</label>**

**<div class="input-glow-container rounded-lg px-4 py-3 ring-1 ring-danger/10">**

**<input class="bg-transparent border-none text-right font-mono text-sm text-white focus:ring-0 w-full outline-none" type="text" value="66397.10"/>**

**</div>**

**</div>**

**</div>**

**<div class="space-y-4 pt-4">**

**<div class="flex justify-between items-center text-\[10px] font-bold uppercase tracking-\[0.15em]">**

**<span class="text-gray-500">Leverage: <span class="text-primary">10x</span></span>**

**<span class="text-gray-600">Cross Margin</span>**

**</div>**

**<input max="100" min="1" type="range" value="10"/>**

**<div class="flex justify-between text-\[8px] font-mono text-gray-600 px-1 uppercase tracking-widest">**

**<span>1x</span>**

**<span>25x</span>**

**<span>50x</span>**

**<span>75x</span>**

**<span>100x</span>**

**</div>**

**</div>**

**<button class="w-full mt-6 py-4 rounded-lg bg-\[#0a0b0c] border border-white/5 text-gray-500 font-bold uppercase tracking-\[0.3em] text-xs hover:text-white hover:border-white/10 transition-all shadow-lg active:scale-\[0.98]">**

                            **Reset Params**

                        **</button>**

**</div>**

**</div>**

**</div>**

**<div class="lg:col-span-6 flex flex-col">**

**<div class="flex-1 obsidian-chassis rounded-\[2.5rem] p-1.5 overflow-hidden flex flex-col chamfered-edge">**

**<div class="bg-primary text-black font-bold uppercase tracking-\[0.4em] text-\[10px] text-center py-3">**

                        **Real-time Analytics**

                    **</div>**

**<div class="flex-1 glass-panel-grid p-10 flex flex-col justify-between">**

**<div class="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>**

**<div class="text-center relative z-10">**

**<span class="text-\[10px] font-mono uppercase tracking-\[0.3em] text-gray-500 mb-8 block">Projected Position Size</span>**

**<div class="relative inline-block mt-4">**

**<div class="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150 opacity-40"></div>**

**<div class="flex items-baseline justify-center gap-4 relative">**

**<span class="font-mono text-6xl md:text-8xl font-bold text-primary drop-shadow-\[0\_0\_20px\_rgba(0,255,157,0.5)]">**

                                        **0.0264**

                                    **</span>**

**<span class="text-primary/40 font-mono text-xl tracking-tighter uppercase">BTC</span>**

**</div>**

**</div>**

**<span class="text-gray-600 font-mono text-\[10px] mt-6 block tracking-widest uppercase">$1,742.86 Adjusted Value</span>**

**</div>**

**<div class="space-y-6 mt-12 relative z-10">**

**<div class="flex justify-between items-center group cursor-default">**

**<span class="text-xs text-gray-500 tracking-widest uppercase font-display group-hover:text-gray-300 transition-colors">Initial Margin</span>**

**<span class="font-mono text-white text-xl font-bold">$174.29</span>**

**</div>**

**<div class="flex justify-between items-center group cursor-default">**

**<span class="text-xs text-gray-500 tracking-widest uppercase font-display group-hover:text-gray-300 transition-colors">Risk Liability</span>**

**<span class="font-mono text-danger text-xl font-bold drop-shadow-\[0\_0\_10px\_rgba(255,68,68,0.3)]">$11,250.00</span>**

**</div>**

**<div class="flex justify-between items-center group cursor-default">**

**<span class="text-xs text-gray-500 tracking-widest uppercase font-display group-hover:text-gray-300 transition-colors">Projected ROI</span>**

**<span class="font-mono text-primary text-xl font-bold drop-shadow-\[0\_0\_10px\_rgba(0,255,157,0.3)]">$45,820.77</span>**

**</div>**

**<div class="pt-4 border-t border-white/5 flex justify-between items-center">**

**<span class="text-xs text-gray-500 tracking-widest uppercase font-display">R:R Alpha</span>**

**<div class="px-3 py-1 bg-primary/10 rounded border border-primary/20">**

**<span class="font-mono text-primary font-bold">1 : 4.07</span>**

**</div>**

**</div>**

**</div>**

**<div class="mt-12 text-center opacity-30">**

**<span class="text-\[8px] font-mono text-gray-500 tracking-\[0.2em]">**

                                **CALC ENGINE v4.2.0 // CRYPTO\_STRATEGY\_LOADED**

                            **</span>**

**</div>**

**</div>**

**<div class="h-8 bg-\[#0a0b0c] border-t border-white/5 flex items-center justify-center gap-10">**

**<div class="w-16 h-1 rounded-full bg-black/50 shadow-inner"></div>**

**<div class="w-16 h-1 rounded-full bg-black/50 shadow-inner"></div>**

**<div class="w-16 h-1 rounded-full bg-black/50 shadow-inner"></div>**

**</div>**

**</div>**

**</div>**

**</div>**

**</main>**

**<footer class="mt-20 pb-10 text-center opacity-20">**

**<p class="text-\[9px] font-mono tracking-\[0.5em] text-gray-500 uppercase">Industrial Grade Risk Assessment Hardware Interface</p>**

**</footer>**



**</body></html>**

