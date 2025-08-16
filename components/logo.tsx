"use client"

import type React from "react"

interface LogoProps {
	className?: string
	src?: string
	alt?: string
	height?: number
}

export function Logo({ className, src = "/knockwise-logo.png", alt = "KnockWise", height = 40 }: LogoProps) {
	return <img src={src} alt={alt} className={className ?? "w-auto"} style={{ height }} />
}


