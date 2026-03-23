import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"
type Preset = "emerald" | "sapphire" | "oasis"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  preset: Preset
  setTheme: (theme: Theme) => void
  setPreset: (preset: Preset) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  preset: "emerald",
  setTheme: () => null,
  setPreset: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [preset, setPreset] = useState<Preset>(
    () => (localStorage.getItem("lomixa-preset") as Preset) || "emerald"
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")
    root.removeAttribute("data-theme")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    if (preset !== "emerald") {
      root.setAttribute("data-theme", preset);
      document.body.setAttribute("data-theme", preset);
    } else {
      root.removeAttribute("data-theme");
      document.body.removeAttribute("data-theme");
    }
  }, [theme, preset])

  const value = {
    theme,
    preset,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    setPreset: (preset: Preset) => {
      localStorage.setItem("lomixa-preset", preset)
      setPreset(preset)
    }
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
