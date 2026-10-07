"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Submit button for <form action={serverAction}>: disables itself and shows a
// spinner while the action is running, so a click always gets instant feedback.
export function SubmitButton({ children, disabled, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
