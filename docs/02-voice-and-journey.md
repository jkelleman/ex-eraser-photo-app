# Voice and journey

## Voice principles

- **Calm and steady.** Short sentences, no exclamation points, no jokes about the ex.
- **The user sets the pace.** Every screen has a way to pause or skip.
- **Neutral about the person.** The app never judges them. It calls them by the name the user gives, or "this person."
- **Plain about safety.** Say clearly what happens to photos and face data, every time it matters.

## Journey at a glance

The check-in sets how much someone takes on today.

```mermaid
flowchart TD
    A[1. Welcome] <-->|optional| H[How does it work?]
    A --> B[2. Photo access]
    B --> C[3. Choose the person]
    C --> D[4. Check in]
    D -->|a break or not sure| F[Fade their photos]
    D -->|ready| E[5. Shared children?]
    E --> O[6. The options]
    O --> R[7. Review a batch of 20]
    R -->|next 20| R
    R -->|photos marked Delete| X[Final delete review]
    R -->|done for today| Z[8. Closing]
    X --> Z
    F --> Z
    Z -->|return visits| V[Vault and settings]
```

People who need a break go straight to Fade and finish early. Everyone else reviews photos in batches of 20 until they're done for the day, and photos marked Delete get a final review first.
