import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useT } from "@/i18n"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const t = useT()
  return (
    <Loader2Icon
      role="status"
      aria-label={t("shell.loading")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
