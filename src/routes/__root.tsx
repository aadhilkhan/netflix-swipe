import type { QueryClient } from "@tanstack/react-query"
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import type * as React from "react"
import { Suspense } from "react"
import { Toaster } from "sonner"
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary"
import { NotFound } from "~/components/NotFound"
import { seo } from "~/utils/seo"
import appCss from "../styles/app.css?url"
import customCss from "../styles/custom.css?url"

export const Route = createRootRouteWithContext<{
    queryClient: QueryClient
}>()({
    head: () => ({
        meta: [
            {
                charSet: "utf-8"
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1"
            },
            ...seo({
                title: "Netflix & Decide",
                description: "Swipe on shows with your partner. Find what you both love."
            })
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss
            },
            {
                rel: "stylesheet",
                href: customCss
            },
            {
                rel: "apple-touch-icon",
                sizes: "180x180",
                href: "/apple-touch-icon.png"
            },
            {
                rel: "icon",
                type: "image/png",
                sizes: "32x32",
                href: "/favicon-32x32.png"
            },
            {
                rel: "icon",
                type: "image/png",
                sizes: "16x16",
                href: "/favicon-16x16.png"
            },
            { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
            { rel: "manifest", href: "/site.webmanifest", color: "#E50914" },
            { rel: "icon", href: "/favicon.ico" }
        ]
    }),
    errorComponent: (props) => {
        return (
            <RootDocument>
                <DefaultCatchBoundary {...props} />
            </RootDocument>
        )
    },
    notFoundComponent: () => <NotFound />,
    component: RootComponent
})

function RootComponent() {
    return (
        <RootDocument>
            <Suspense fallback={<div className="flex min-h-svh items-center justify-center text-zinc-400">Loading...</div>}>
                <Outlet />
            </Suspense>
        </RootDocument>
    )
}

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <head>
                <HeadContent />
            </head>
            <body className="min-h-svh bg-black text-white">
                {children}
                <Toaster />
                <Scripts />
            </body>
        </html>
    )
}
