/**
 * Print a document the browser builds for us, without opening a window.
 *
 * A pop-up is the obvious way to do this and the wrong one: on a hosted site a
 * blocker stops `window.open`, and the engineer is told to go and change a
 * browser setting to save a report. A hidden same-origin frame has nothing to
 * block - the print dialogue comes up over the page the button was pressed on,
 * and the frame is taken away again afterwards.
 *
 * `srcdoc` rather than `document.write`: the frame inherits this page's origin,
 * so the blob and data URLs behind captured photographs resolve inside it.
 */
export function printDocument(html: string) {
  const frame = document.createElement("iframe")
  frame.setAttribute("aria-hidden", "true")
  frame.setAttribute("tabindex", "-1")
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"

  let gone = false
  const remove = () => {
    if (gone) return
    gone = true
    frame.remove()
  }

  frame.onload = () => {
    const win = frame.contentWindow
    if (!win) return remove()

    /*
     * Printing before the photographs have decoded prints their boxes empty,
     * so the dialogue waits for them. A picture that fails to load must not
     * hold the report back, so a failure resolves like a success.
     */
    const images = [...(frame.contentDocument?.images ?? [])]
    const ready = images.map((img) =>
      img.complete ? Promise.resolve() : new Promise<void>((done) => {
        img.addEventListener("load", () => done(), { once: true })
        img.addEventListener("error", () => done(), { once: true })
      })
    )

    void Promise.all(ready).then(() => {
      // Safari reports afterprint late, so the frame is taken away on a timer too
      win.addEventListener("afterprint", () => window.setTimeout(remove, 0), { once: true })
      window.setTimeout(remove, 120_000)
      win.focus()
      win.print()
    })
  }

  document.body.appendChild(frame)
  frame.srcdoc = html
}
