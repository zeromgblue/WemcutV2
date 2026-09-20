import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimecode(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${wholeSeconds.toString().padStart(2, "0")}`;
}

export function formatRelativeTime(date: string | Date): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);

  if (seconds < 60) return "เมื่อสักครู่";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} เดือนที่แล้ว`;

  const years = Math.floor(months / 12);
  return `${years} ปีที่แล้ว`;
}
