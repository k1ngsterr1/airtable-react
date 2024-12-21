import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  fullScreen?: boolean;
}

export function LoadingScreen({ fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background/80 backdrop-blur-sm",
        fullScreen ? "fixed inset-0 z-50" : "w-full h-full"
      )}
    >
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="mt-2 text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}
