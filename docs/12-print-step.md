# Print step

After finishing a batch, the user can print a few favorites and pick them up at a Walgreens the same day. A working demo is in [`prototype/`](../prototype/README.md).

## Rules

- Only edited photos (cropped, erased or replaced) can be printed. Faded photos still show the person, so they're left out, and the page says why.
- Photos are uploaded only when the user places the order, and only the ones they chose. Face data is never sent.
- Every order needs the user to accept the Walgreens terms, as Walgreens requires.
- Up to 20 copies of each photo and 200 photos per order, per Walgreens' limits.

## Copy

*Demo mode label (header):* "Demo: no real orders are placed"

### Step 1: Photos

**Heading:** "Print a few favorites"

"These are the photos you've finished. Choose any you'd like to hold in your hands."

*Size picker legend:* "Print size"

*Each photo:* "Add to order", which changes to "In your order" once chosen. A "Copies" control with − and + buttons appears under chosen photos.

*Faded note:* "2 faded photos aren't shown here, since faded photos haven't been edited. You can change them in the vault first."

*Privacy line:* "Your privacy. Only the photos you choose are sent to Walgreens for printing. Face data never leaves your phone."

*Order summary:* "Your order" with photos, prints, pickup, ready time and subtotal. On phones: "4 prints, 5×7 in" and the subtotal. When empty: "No photos chosen."

**Button:** Choose a store

*If nothing is selected:* "Choose at least one photo to print."

### Step 2: Store

**Heading:** "Choose a store"

"Pick the Walgreens where you'd like to pick up your prints."

**Buttons:** Use my location · Use a demo location (Boston)

*While searching:* "Finding stores near you…"

*Results:* "Found 3 stores that can print your order." Each store shows its address, distance and ready time, such as "Ready: Today, 3:30 PM."

*Store temporarily unavailable:* ready time shows "Within 48 hours."

*No stores:* "I couldn't find a store that can print this order nearby. Try another location."

*Location denied:* "I couldn't get your location. You can use the demo location instead, or try again."

**Buttons:** Back · Add your details

### Step 3: Details

**Heading:** "Your details"

"Walgreens uses these to let you know when your prints are ready."

*Fields:* First name · Last name · Email · Phone ("Include your area code.")

*Review:* Prints · Photos · Pickup · Ready · Subtotal, then "Walgreens confirms tax and the final price."

*Terms:* "I agree to the Walgreens Terms of Use and Online Privacy & Security Policy." (Placeholder. Replace with the exact copy Walgreens provides.)

**Buttons:** Back · Send to Walgreens

*While sending:* "Sending your photos…"

*Missing fields:* "Please fill in the highlighted fields."

*Terms not checked:* "Please agree to the Walgreens terms to place your order."

*Walgreens error:* "Walgreens couldn't take the order right now. Your photos are still here, so you can try again in a moment."

### Step 4: Done

**Heading:** "Your prints are on their way"

"Pick them up at the Walgreens at [street], [city]. Ready: [time]."

"Order number [number]. Walgreens will email you when they're ready."

**Buttons:** Check status · Print more photos

*Status labels:* Sending to the store · Downloading at the store · Received at the store · Ready for pickup · Picked up · Cancelled by Walgreens · Cancelled at the store
