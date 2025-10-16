"use client"

import React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if theme is stored in localStorage
    const savedTheme = localStorage.getItem("theme") as Theme
    // Check if user has a system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    // Return saved theme if it exists, otherwise use system preference
    return savedTheme || (prefersDark ? "dark" : "light")
  })

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem("theme", theme)

    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark-theme")
      document.documentElement.classList.remove("light-theme")
    } else {
      document.documentElement.classList.add("light-theme")
      document.documentElement.classList.remove("dark-theme")
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
