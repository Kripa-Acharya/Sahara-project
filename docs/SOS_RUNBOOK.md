# साहारा — SOS / Emergency Runbook

**साहारा is not an emergency service.** It does not replace police, ambulance,
hospital or government services. In any life-threatening situation the caller
must be directed to local emergency services first: **Police 100 ·
Ambulance 102**. Say this plainly to families and companions; never imply
otherwise.

---

## 1. What an SOS is (and is not)

An SOS is raised by:
- an **elder**, from the elder screen (`/elder`) — no login, identified by access code, or
- a **companion**, during a visit.

It creates an `EmergencyAlert` (status `ACTIVE`), notifies all administrators
and the family in-app, and writes a `critical` log line.

It is **not** a dispatch system: nobody is automatically sent. A human must
acknowledge and act. There is no live location tracking — the alert stores the
elder's registered address text as recorded, not a live position.

## 2. Immediate response (target: acknowledge within 5 minutes)

1. **Open** `/admin/emergencies`. Active alerts are at the top.
2. **Acknowledge** the alert. This records who owns it and stops it reading as unhandled.
3. **Call, in this order**, using the one-tap links on the alert:
   1. **The elder's local emergency contact** — nearest able-bodied help.
   2. **The assigned companion**, if a visit is in progress.
   3. **The family member** (often abroad — check the time, but call anyway for a genuine emergency).
4. **If there is any sign of a medical or safety emergency**, tell whoever is closest to call **102 (ambulance)** or **100 (police)** now. Do not wait for साहारा staff to reach the home.
5. **Record what you learn** as you go — you will need it for the resolution note.

## 3. If nobody answers

- Try the secondary emergency contacts on the elder's profile.
- Try the family's alternate number if recorded.
- If a companion is nearby and available, ask them to visit — this is a welfare check, not a rescue.
- If you cannot reach anyone and there is reason to fear for the elder's safety, advise the family to contact local emergency services, and record that advice.

Automated escalation timers and alternate-contact escalation are **not yet
implemented** (Phase 6). Until then, escalation is manual and must not be
assumed to happen on its own.

## 4. Resolving

Resolve only when you know the outcome. A resolution note is **mandatory** and
is shown to the family, so write it as an update to a worried relative:

> "Called Hari (brother, lives nearby). He reached the house in 20 minutes.
> Krishna dai had felt dizzy after the stairs and is resting. Doctor consulted
> by phone; no ambulance needed. Family informed at 14:10 NPT."

Resolution notifies the family automatically. If an SOS turns out to be an
accidental press, still call to confirm, then resolve with a note saying so.

## 5. False alarms and drills

- **Accidental press:** confirm by phone, then resolve with "accidental press, elder confirmed safe". Never resolve without contact.
- **Drills:** a dedicated drill flag is not implemented yet, so a test alert is indistinguishable from a real one in the queue. Until Phase 6 lands, run drills only with the on-duty team informed in advance, and prefix the resolution note with `DRILL —`.
- Repeated accidental presses from one elder: check whether the SOS button placement or screen size suits them, and talk to the family.

## 6. After the incident

- Confirm the family has been told what happened, by a human, not only by notification.
- Open an `Incident` record if there is anything to follow up (safety concern at the home, companion conduct, repeated false alarms).
- Any alert that involved emergency services, injury, or a failure of साहारा to respond in time goes to a post-incident review within 5 working days (see `OPERATIONS_RUNBOOK.md` §6).

## 7. Known limitations to communicate honestly

- Notifications currently reach people **in-app only** — no SMS, email or voice yet (Phase 5). Assume a family may not see an alert until they open the app.
- No automatic escalation if an alert is not acknowledged (Phase 6).
- Location is the registered address, not live GPS.
- The elder screen requires an access code on a device someone set up; an elder without that device cannot raise an in-app SOS.

Never overstate what the platform can do. A family's trust depends on knowing
exactly what साहारा does and does not promise.
