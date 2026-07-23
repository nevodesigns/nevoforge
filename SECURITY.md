# NevoForge Safe Handling Procedure

Every NevoForge order involves running a stranger's file through a pipeline on
my own machine, which holds my wallet config and SSH keys. This is the checklist
for doing that safely. Follow it on every order, no exceptions.

## The threat model in one line

The files are untrusted, and anything I run as my user can read
`~/.ssh/id_ed25519`, `~/.onchainos`, and `~/.config/pxxl/config.json`. So the
rule is simple: pipelines only ever **read** client files, never execute them.

## Where client files go

Store every client file in a quarantine directory outside every git repo:

```
~/clientwork/<order-id>/in/     incoming files from the client
~/clientwork/<order-id>/out/    deliverables I produce
```

Never put client files inside `~/nevoforge`, `~/nevoforge-site`, or
`~/nevodesigns.github.io`. That prevents accidentally committing a client's
confidential CAD file, and keeps them out of anything that gets published.

## Before processing, every time

1. **Check the size.** The pipelines enforce limits (50 MB for STEP, 5 MB for
   markdown) and will exit with a clear error, but check first so you can tell
   the client early.
   ```
   ls -la ~/clientwork/<order-id>/in/
   ```
2. **Confirm the file is what they claim.** Extensions lie.
   ```
   file thefile.step        # should say ASCII text, not PNG or archive
   head -3 thefile.step     # a real STEP starts with ISO-10303-21;
   ```
3. **For decks and HTML, read it before rendering.** Look for anything that
   reaches the network or tries to run:
   ```
   grep -inE "script|fetch|iframe|http://|https://|onerror|onload|srcdoc" thefile.html
   ```
   Strip or localise every remote reference. Download legitimate images
   yourself, check them, and reference them from local paths.

## Never

- Never run, open, execute, or double-click a client file. Reading is the only
  operation.
- Never `npm install`, `pip install`, or run a script a client suggests, even
  if it is "just to open the file".
- Never relax the Chrome flags in `design-studio/build-pdf.sh` to make a
  client's deck work. Those flags block all network access on purpose. If a
  deck needs a remote asset, fetch it yourself and reference it locally.
- Never process a client file with the wallet CLI authenticated in the same
  terminal session if it can be avoided.
- Never paste client file contents into a chat or an online tool without
  reading it first.

## Rendering client decks

**Always use the sandboxed renderer for anything a client sent:**

```
cd design-studio
./build-pdf-sandboxed.sh ~/clientwork/<order-id>/in/deck.html ~/clientwork/<order-id>/out/deck.pdf
```

`build-pdf-sandboxed.sh` runs Chrome inside its own empty network namespace via
bubblewrap, the same isolation `docker run --network none` provides. The
namespace has no interfaces and its own isolated loopback, so egress is
physically impossible, not merely blocked. A request to a literal IP such as
`http://127.0.0.1:8099` or a LAN address cannot reach the host. The filesystem
is mounted read only apart from the output directory, and Chrome's own renderer
sandbox stays enabled on top.

`build-pdf.sh` is the fallback for when bubblewrap is unavailable. It blocks
name resolution with `--host-resolver-rules="MAP * ~NOTFOUND"`. Measured, this
also stops direct IP and LAN requests, but it is a Chrome level control rather
than a kernel level one, so prefer the sandbox.

Measured results, same malicious deck against each (direct IP and LAN IP, via
both `<img>` and `fetch`):

| Renderer | Requests that reached the listener |
|---|---|
| Plain Chrome, no protection | 4 of 4 |
| `build-pdf.sh` (DNS blocked) | 0 of 4 |
| `build-pdf-sandboxed.sh` (network namespace) | 0 of 4 |

Neither renderer loads remote assets, by design. Download any legitimate image
or font yourself, check it, and reference it locally.

## What the pipelines already protect against

- **Decks:** two layers are available, and for client HTML you should use the
  sandboxed one. See "Rendering client decks" below.
- **STEP files:** size and entity limits reject oversized input with a clear
  error instead of exhausting memory. The parser has no `eval`, `exec`, or
  shell invocation.
- **Reports:** client-derived text (part names, filenames) is escaped before it
  enters a report, so a crafted file cannot inject headings, tables, or remote
  images into a deliverable.

## After delivering

- Keep the client's source files only as long as needed for revisions, then
  delete the quarantine directory.
- Never commit a client's file or deliverable to a public repo.

## If something looks wrong

If a file behaves oddly, the render hangs, or output contains content you did
not write, stop. Do not deliver it. Delete the working copy, and if you suspect
the machine was touched, rotate the Pxxl API key and review the wallet audit
log before doing anything else.
