import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "./ui/dialog";
import { Button } from "./ui/button";
import { History } from "lucide-react";
import HistoryContent from "./history-content";
import { useGameHistory } from "../hooks/use-game-history";

export default function HistoryDialog({ trigger }) {
  const { history, isLoading, clearHistory } = useGameHistory();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <History className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-800 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-purple-400" />
            Game History
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-1">
           <HistoryContent 
             history={history} 
             isLoading={isLoading} 
             onClearHistory={clearHistory} 
           />
        </div>
      </DialogContent>
    </Dialog>
  );
}
