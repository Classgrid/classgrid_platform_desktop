import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { useTheme } from "next-themes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AiChartRendererProps {
  config: any;
}

export function AiChartRenderer({ config }: AiChartRendererProps) {
  const { resolvedTheme } = useTheme();
  // We use a small delay to ensure CSS variables are applied when switching themes
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [resolvedTheme]);

  const defaultStyles = useMemo(() => {
    // Force dependency on key so it re-computes when theme changes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _force = key;
    
    if (typeof window === "undefined") return { text: "#666", grid: "#ddd", colors: [] };
    
    const style = getComputedStyle(document.body);
    
    // Helper to get raw CSS var value, which might be in oklch(l c h) format
    // Chart.js requires standard color strings. Fortunately it supports oklch() in modern browsers!
    const getVar = (name: string, fallback: string) => {
      let val = style.getPropertyValue(name).trim();
      if (!val) return fallback;
      // If it's a raw oklch value without the function wrapper (Tailwind v4), wrap it
      if (/^0\.\d+/.test(val) || /^\d+\.?\d*/.test(val)) {
         val = `oklch(${val})`;
      }
      return val;
    };

    // If --foreground is just 'hsl(var(--foreground))', we assume modern CSS setup.
    // In global.css, --foreground is a hex code or hsl depending on the class.
    // We will extract it.
    let textStr = style.getPropertyValue("--foreground").trim();
    if (!textStr.startsWith("#") && !textStr.startsWith("rgb") && !textStr.startsWith("hsl") && !textStr.startsWith("oklch")) {
       textStr = textStr ? `hsl(${textStr})` : "#666";
       // Handle hex raw
       if (textStr.includes("#")) {
         textStr = style.getPropertyValue("--foreground").trim();
       }
    }
    
    let borderStr = style.getPropertyValue("--border").trim();
    if (!borderStr.startsWith("#") && !borderStr.startsWith("rgb") && !borderStr.startsWith("hsl") && !borderStr.startsWith("oklch")) {
       borderStr = borderStr ? `hsl(${borderStr})` : "#ddd";
       if (borderStr.includes("rgba") || borderStr.includes("#")) {
          borderStr = style.getPropertyValue("--border").trim();
       }
    }

    const c1 = getVar("--chart-1", "#3b82f6");
    const c2 = getVar("--chart-2", "#10b981");
    const c3 = getVar("--chart-3", "#f59e0b");
    const c4 = getVar("--chart-4", "#ef4444");
    const c5 = getVar("--chart-5", "#8b5cf6");

    return {
      text: textStr || (resolvedTheme === 'dark' ? "#fff" : "#000"),
      grid: borderStr || (resolvedTheme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
      colors: [c1, c2, c3, c4, c5]
    };
  }, [key, resolvedTheme]);

  const chartData = useMemo(() => {
    if (!config?.data) return { datasets: [] };
    const cloned = JSON.parse(JSON.stringify(config.data));
    if (cloned.datasets) {
      cloned.datasets.forEach((ds: any, idx: number) => {
        // Apply default colors if not provided
        if (!ds.backgroundColor) {
           const color = defaultStyles.colors[idx % defaultStyles.colors.length];
           ds.backgroundColor = color;
           // If pie/doughnut, distribute colors to elements
           if (config.type === "pie" || config.type === "doughnut" || config.type === "polarArea") {
             ds.backgroundColor = ds.data.map((_: any, i: number) => defaultStyles.colors[i % defaultStyles.colors.length]);
           }
        }
        if (!ds.borderColor) {
          const color = defaultStyles.colors[idx % defaultStyles.colors.length];
          ds.borderColor = color;
           if (config.type === "pie" || config.type === "doughnut" || config.type === "polarArea") {
             ds.borderColor = resolvedTheme === 'dark' ? '#111' : '#fff'; // separate slices
           }
        }
        // Round bars
        if (config.type === 'bar' || ds.type === 'bar') {
          ds.borderRadius = 6;
          ds.borderSkipped = false;
        }
      });
    }
    return cloned;
  }, [config, defaultStyles, resolvedTheme]);

  const chartOptions = useMemo(() => {
    const base = config?.options || {};
    
    // Apply global font and colors
    ChartJS.defaults.color = defaultStyles.text;
    ChartJS.defaults.font.family = 'var(--font-body), sans-serif';

    const options = {
      ...base,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...base.plugins,
        legend: {
          ...base.plugins?.legend,
          labels: {
            ...base.plugins?.legend?.labels,
            color: defaultStyles.text
          }
        },
        tooltip: {
          backgroundColor: resolvedTheme === 'dark' ? '#000' : '#fff',
          titleColor: resolvedTheme === 'dark' ? '#fff' : '#000',
          bodyColor: resolvedTheme === 'dark' ? '#eee' : '#222',
          borderColor: defaultStyles.grid,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          displayColors: true,
          ...base.plugins?.tooltip
        }
      },
      scales: (config.type !== 'pie' && config.type !== 'doughnut' && config.type !== 'radar' && config.type !== 'polarArea') ? {
        x: {
          ...base.scales?.x,
          grid: {
            color: defaultStyles.grid,
            ...base.scales?.x?.grid
          },
          ticks: {
            color: defaultStyles.text,
            ...base.scales?.x?.ticks
          }
        },
        y: {
          ...base.scales?.y,
          grid: {
            color: defaultStyles.grid,
            ...base.scales?.y?.grid
          },
          ticks: {
            color: defaultStyles.text,
            ...base.scales?.y?.ticks
          }
        }
      } : base.scales
    };

    if (config.type === 'radar' || config.type === 'polarArea') {
       options.scales = {
         r: {
           ...base.scales?.r,
           grid: { color: defaultStyles.grid },
           angleLines: { color: defaultStyles.grid },
           ticks: { backdropColor: 'transparent', color: defaultStyles.text },
           pointLabels: { color: defaultStyles.text }
         }
       };
    }

    return options;
  }, [config, defaultStyles, resolvedTheme]);

  if (!config || !config.type) {
    return <div className="text-red-500 p-4 border rounded-xl">Invalid Chart Config</div>;
  }

  return (
    <div className="w-full h-[300px] sm:h-[350px] relative font-sans" key={key}>
      <Chart type={config.type} data={chartData} options={chartOptions} />
    </div>
  );
}
