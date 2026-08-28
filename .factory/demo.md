# Thought Parking demo

Open [the demo](/demo/) or append `?demo=1` to any app route. The landing-page **Try it with sample data** action opens the same sandbox in one click.

The demo starts with three realistic interruption slips: two waiting for review and one already promoted. You can capture, review, archive, promote, export, or reset them without affecting your own parking lot.

The sandbox uses the IndexedDB database `demo:thought-parking` and browser keys prefixed `demo:thought-parking:`. Real sessions use `thought-parking` and `thought-parking:` instead. The app selects the demo database before it reads data, so a visible demo banner never reads or writes the real namespace.

Use **Reset demo** to restore the shipped sample. Use **Start for real** to leave the sandbox; this discards the demo view and opens the ordinary local parking lot.
