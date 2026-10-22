# The Pointer That Stayed — narration

US English, Kokoro am_michael, speed 1.0, no tempo processing. Sentence boundaries are separate clips.

**S01-1** The request is gone.

**S01-2** Its pointer isn't.

**S02-1** Inside a PHP worker, one request creates data in memory.

**S02-2** Worker-wide state keeps a reference to that data.

**S03-1** When the request ends, its memory is released, but some state can still point there.

**S04-1** Now the same worker handles another request.

**S04-2** Before normal initialization resets that state, an early operation can use the stale reference.

**S05-1** That's use-after-free: accessing memory after its lifetime has ended.

**S05-2** Under exploitable conditions, an attacker can turn that memory error into remote code execution.

**S05-3** That means the worker's permissions, not automatic root access.

**S06-1** The exact trigger depends on the deployment and internal state involved.

**S06-2** PHP's fix addresses this lifecycle bug.

**S06-3** Patch the runtime, restart affected workers, and verify the version actually serving requests.
