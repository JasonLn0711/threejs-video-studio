# Sources and interpretation

Reviewed 2026-10-20. The film makes one claim: a distributed traffic flood can
exhaust a shared link, delaying or dropping legitimate traffic.

[RFC 4732, section 2.7](https://www.rfc-editor.org/rfc/rfc4732#section-2.7)
describes denial of service against links. This is an Informational RFC, not an
Internet Standard. Section 1 also distinguishes malicious traffic from other
overload causes: high volume alone does not establish hostile intent.

The animation uses a deliberately simple illustrative FIFO queue: 8 service
slots per second, a 24-packet waiting limit, 2 normal arrivals per second and a
rising rate from three stipulated attack sources. Arrival propagation has small
deterministic variation to avoid synchronization artifacts. Quantities are
model parameters, not measurements or networking recommendations.

The three attack devices represent distributed sources; the film does not
explain how they became controlled. Real paths, queues and scheduling policies
are more complex. The displayed colors represent roles assigned by the author,
not a claim that a router can identify traffic intent from color or volume.

The lit server shows that network availability can fail without the server
machine stopping. This mechanism does not describe all DDoS variants.

The reference project deliberately has no packet sender, scanner, exploit,
target address, botnet control or real traffic replay.
