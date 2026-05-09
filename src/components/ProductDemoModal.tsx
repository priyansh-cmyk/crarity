import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const ProductDemoModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Play className="w-4 h-4" />
          Product Demo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Product Demo</DialogTitle>
        </DialogHeader>
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          {/* Replace this div with your video embed */}
          <div className="text-center text-muted-foreground">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Video coming soon</p>
            <p className="text-sm mt-2">Replace this with your video embed code</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDemoModal;
