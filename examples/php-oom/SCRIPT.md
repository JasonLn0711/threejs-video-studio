# Before Your Code Runs — narration

US English, Kokoro am_michael, speed 1.0, no tempo processing. Sentence boundaries are separate clips.

**S01-1** Your website's code hasn't even started.

**S01-2** But PHP is already parsing an incoming request.

**S02-1** While internal data is still being initialized, a memory allocation fails.

**S03-1** PHP's old out-of-memory handling jumps out of that work.

**S04-1** The trouble comes next: cleanup can treat the unfinished data as valid.

**S04-2** With a carefully crafted request, that memory error can become remote code execution, without a login.

**S05-1** The code runs with the web worker's permissions, so root access isn't automatic.

**S05-2** This was demonstrated with Apache's mod_php; other deployments have different conditions.

**S06-1** PHP patched the flaw on October twenty-first.

**S06-2** Update the PHP runtime, then verify the running service has loaded the fix.

**S06-3** A firewall can't repair the runtime underneath your site.
