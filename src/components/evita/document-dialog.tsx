import { useState } from "react"
import { Download, ExternalLink, FileText, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { Panel } from "@/lib/ui-store"

/**
 * A document read where it was opened from.
 *
 * A report used to open in a tab of its own, which on a tablet means leaving
 * EVITA: the app is full-screen, the engineer loses the list they were working
 * down, and coming back is a gesture rather than a tap. The reader keeps the
 * screen behind it and closes back onto the same row.
 *
 * The page itself is drawn by the browser's own PDF viewer in a frame, so
 * scrolling, zoom, page numbers and search are the ones the engineer already
 * knows, and EVITA carries no PDF renderer of its own.
 *
 * Caveat: a frame is how a desktop browser shows a PDF, and Chrome on Android
 * does not render one inline - the frame comes up blank there. That is why
 * Open and Download are on the bar rather than hidden behind the frame, and
 * why the message under it names the way out.
 *
 * TODO(evita): if the Galaxy Tab has to show these inline, render the pages
 * with pdf.js instead of the frame. It is a dependency and a canvas per page,
 * so it is not worth it until a device makes it necessary.
 */
export function DocumentDialog({
  document,
  onOpenChange,
}: {
  document: Extract<Panel, { kind: "document" }>
  onOpenChange: (open: boolean) => void
}) {
  /* The frame fires `load` for a failed render too, so this only clears the spinner */
  const [drawn, setDrawn] = useState(false)

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        /* Near enough full screen: a PDF page is portrait and read at size */
        /*
          * Landscape is where a report is actually read - the tablet is turned,
          * the page is wide and short - so the cap comes off and the reader
          * takes the screen but for a margin.
          */
        className="grid h-[94svh] w-[calc(100%-1rem)] max-w-[96rem] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)] landscape:w-[calc(100%-1.5rem)] landscape:max-w-none"
      >
        {/* The bar: what is open on the left, what can be done with it on the right */}
        <header className="flex min-w-0 items-center gap-2 border-b bg-card px-3 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-critical-soft text-critical">
            <FileText className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base leading-tight">{document.title}</DialogTitle>
            <DialogDescription className="truncate text-xs">
              {document.detail ?? "PDF document"}
            </DialogDescription>
          </span>

          {/* Both the way out of a frame that cannot draw and the way to keep a copy */}
          <Button variant="outline" size="sm" className="h-10 shrink-0 max-sm:hidden" asChild>
            <a href={document.file} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> Open
            </a>
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Open in a new tab" className="shrink-0 sm:hidden" asChild>
            <a href={document.file} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
            </a>
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Download" className="shrink-0" asChild>
            <a href={document.file} download>
              <Download />
            </a>
          </Button>
          <Button size="sm" className="h-10 shrink-0" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </header>

        <div className="relative min-h-0 bg-muted">
          {!drawn ? (
            <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Opening {document.title}…
            </p>
          ) : null}

          {/*
            * `view=FitH` fits the page across the frame, which is how a report is
            * read; the side panel is off because the frame is not wide enough to
            * spare the column.
            */}
          <iframe
            src={`${document.file}#view=FitH&navpanes=0`}
            title={document.title}
            onLoad={() => setDrawn(true)}
            className="size-full border-0"
          />

          {drawn ? null : (
            <p className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-attention-soft px-3 py-2 text-xs text-attention-soft-foreground">
              <TriangleAlert className="size-3.5 shrink-0" />
              Nothing showing? Tap Open to read it in a tab.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
