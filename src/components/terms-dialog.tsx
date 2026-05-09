"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";

export function TermsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if they already accepted
    const accepted = localStorage.getItem("entrydesk_terms_accepted");
    if (!accepted) {
      setIsOpen(true);
    }
  }, []);

  const handleScroll = () => {
    const content = contentRef.current;
    if (!content) return;

    const scrollPercentage = content.scrollTop / (content.scrollHeight - content.clientHeight);
    if (scrollPercentage >= 0.99 && !hasReadToBottom) {
      setHasReadToBottom(true);
    }
  };

  const handleAccept = () => {
    localStorage.setItem("entrydesk_terms_accepted", "true");
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Redirect to home if they don't accept
    window.location.href = "/";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing by clicking outside or pressing Escape
      if (!open && !localStorage.getItem("entrydesk_terms_accepted")) {
        return;
      }
      setIsOpen(open);
    }}>
      <DialogContent 
        className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-2xl [&>button:last-child]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b border-border px-6 py-4 text-base">
            Privacy Policy & Terms of Service
          </DialogTitle>
          <div ref={contentRef} onScroll={handleScroll} className="overflow-y-auto">
            <DialogDescription asChild>
              <div className="px-6 py-4">
                <div className="space-y-4 [&_strong]:font-semibold [&_strong]:text-foreground text-sm">
                  <p>
                    Please read our Privacy Policy and Terms of Service carefully before proceeding. 
                    You must scroll to the bottom to accept.
                  </p>
                  
                  <div className="bg-muted p-4 rounded-md space-y-4">
                    <h3 className="font-semibold text-base text-foreground">Privacy Policy Summary</h3>
                    <p>We respect your privacy and only collect essential data required for event management and platform operations. We do not sell your data to third parties.</p>
                    
                    <h3 className="font-semibold text-base text-foreground">Terms of Service Summary</h3>
                    <p>By using EntryDesk, you agree to use it for legitimate martial arts tournament management. You are responsible for ensuring accuracy and obtaining necessary consent from athletes.</p>
                    
                    <p>
                      You can read the full documents here: <br />
                      <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a> | <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a>
                    </p>
                    
                    {/* Add height to force scrolling */}
                    <div className="h-64 flex items-end">
                      <p className="text-muted-foreground italic">Scroll to bottom to acknowledge...</p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="border-t border-border px-6 py-4 sm:items-center">
          {!hasReadToBottom && (
            <span className="grow text-xs text-muted-foreground max-sm:text-center">
              Read to the bottom before accepting.
            </span>
          )}
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={!hasReadToBottom} onClick={handleAccept}>
            I agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
