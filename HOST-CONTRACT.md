# Voice / Games host contract v1

AI Buddy 2.0.4 provides this contract to official extensions. `contracts/voice-games-v1.json` is the immutable method /
capability manifest. Its SHA-256 is recorded in `contracts/HASH.json` and must be
checked by the installed native package factory before granting a client.

## Native facade

`ctx.buddyVoiceGamesServices.openPlugin({pluginId, contractVersion, contractHash})`
returns `describe()`, `invoke(method,payload)`, `authorizeRequest(request,scope)`, `registerTranscriber(fn)` and
`close()`. Package identity comes from the runtime's verified installed package,
never from its JSON payload. `registerTranscriber` is a backend registration with
an actual cross-process transport, not a renderer callback or permission grant.
Missing host support is a visible compatibility error. All plugins must drain
their own resources on disable, leaving saved game funds intact.

Native HTTP handlers call `authorizeRequest(request,{pluginId,action})` before
dispatch. It validates an actual POST's Host/Origin/cookie and obtains an
action-bound principal from the host session, returning `{contextToken}`. That
principal is carried in the invoke payload and checked for the exact operation.
The host derives the current persona/user seat; caller-supplied IDs are not
authority. GET is readiness/description only. Recording start and final draft
submission remain host-UI-only even after HTTP authorization.

The private backend transport uses `ui.authorize`, `voice.jobs.poll` and
`voice.jobs.complete`. Native transcriber registration runs a long-poll loop,
executes the local adapter and returns a nonce/job/capture-generation-bound
result. Functions are never serialized across the DSH process boundary. The
registration returns an awaited disposer and is cancelled on plugin close.

## Voice

The host signs the target for private APP chat, group APP chat or the user's game
chat seat. A target captures persona, lives, session/membership revision and
operation generation. `voice.target.read` reads only that trusted target.
`voice.capture.request` requests the visible host entry, never starts recording.
Only the exact host panel/capture main frame may start/stop/cancel capture or
submit a final edited draft. Shared DSH media permissions remain denied.

Audio references are opaque, bounded, expiring and revocable. `voice.audio.read`
and `voice.audio.release` cannot read arbitrary paths. The registered transcriber
returns text and provenance to `voice.draft.offer({targetRef,text,transcriptionId})`.
`voice.draft.apply({draftRef,mode,expectedRevision})` preserves original drafts;
allowed modes are `insert` and `replace`. Host submission binds persistent
submissionId, target and text fingerprint; its message and receipt mapping are
committed together. `voice.submission.read` distinguishes inputAccepted from
assistant completion. Unknown results are queried, not blindly resubmitted.

## Games

`games.table.create` accepts `{commandId,type,players,buyIn?,blinds?}`. Players are
host-verified character selections or the current user; payload life/actor IDs
cannot assert authority. `read` takes tableId. Mutations take tableId, commandId
and expectedVersion. `action` adds the proposed action; `next` advances a settled
game/hand; `seats` queues next-hand players; `topup` requests a validated user
top-up. Pause, resume and leave never discard uncertain funds.

`games.model.request({tableId,expectedVersion,requestId})` selects only the current
AI seat and its host-owned binding, builds its private projection and proposes
an action. Up to two same-model correction rounds precede recoverable pause.
`cancel` cannot manufacture an action or release funds. A slow or failed model
is never replaced by a robot. Model accounting stays with ModelRouter.

`games.chat.send({tableId,submissionId,text})` accepts user text to the public
table chat; `read` exposes that channel only. `games.replay.read({tableId,handId})`
requires final Texas settlement, and `review` additionally requires a verified
characterId and requestId. Replay excludes the current hand and undealt deck.

The host registers hash-pinned pure reducers from the verified game package.
Its single economy SQLite transaction owns checkpoints, event sequence, command
deduplication, reserves/escrow, settlement and participation/outbox creation.
The original user wallet is reused. Welfare and life restoration are host-only.
Public errors expose actionable codes without credentials or hidden cards.

## Evidence

Every test report records source/package/contract/component hashes. Fixture
admission tests are distinct from actual DSH installation, runtime activation,
real provider calls, human microphone tests and Mac verification. A local
callback or a simulated plugin page cannot establish cross-process acceptance.

## Card-games UI candidate additions

- `games.table.art` uses the existing `games.table` grant and serves the host's read-only approved character art paths.
- Table reads and successful actions expose display-only `presentation.emotions`, `presentation.lastSpeech` and `presentation.events`. A completed Texas showdown can expose the winning five cards through its presentation event. Live projections never add any hidden cards.
- Action model responses can include optional `say` (up to 40 characters, publicly visible) and `emotion` (an approved expression). The host validates the undecorated action, then records display metadata and accepted dialogue within its commit. The optional fields grant no action, spend, memory, relationship or work authority.
