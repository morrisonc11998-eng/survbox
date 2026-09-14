import { How } from "@/components/result";

function Plate({
  src,
  title,
  children,
  steps,
  note,
}: {
  src: string;
  title: string;
  children?: React.ReactNode;
  steps?: string[];
  note?: string;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface">
      <img src={src} alt={title} className="aspect-[4/3] w-full object-cover" />
      <div className="grid gap-3 p-4">
        <h2 className="font-display text-xl font-semibold tracking-wide">{title}</h2>
        {children ? (
          <div className="grid gap-2 text-sm leading-relaxed text-muted">{children}</div>
        ) : null}
        {steps && steps.length > 0 ? (
          <ol className="grid gap-2">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 w-6 shrink-0 font-mono text-xs tabular-nums text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {note ? <p className="text-xs leading-relaxed text-subtle">{note}</p> : null}
      </div>
    </article>
  );
}

export function ToolCraftShelters() {
  return (
    <div className="grid gap-4">
      <How>
        Shelter before food. Keep the weather off you, the wind off the fire, and
        the fire where it cannot eat the roof. Sleep small. Dry beats pretty.
      </How>
      <Plate
        src="/bushcraft/leanto.jpg"
        title="Lean-to"
        steps={[
          "Site on the lee of a hill, not in a drainage. Opening faces away from the wind.",
          "Lodge a ridge pole in two trees, or on two forked sticks, about chest high.",
          "Lean poles against the ridge on the windward side, tight as a rib cage.",
          "Thatch with bark, boughs, or duff from the ridge down, overlapping like shingles.",
          "Fire in the open side. Stack a log wall on the far side of the fire so heat bounces onto you.",
          "Sleep with your feet toward the fire. Keep the thatch steep or rain walks in.",
        ]}
        note="Not for hard rain unless the thatch is thick and steep. A fire inside a lean-to will eat the roof."
      >
        <p>
          One wall and a roof. You sleep under the slope, fire in the mouth. Fast
          to raise, open to weather on the front. Pair it with a reflector or you
          lose the heat.
        </p>
      </Plate>
      <Plate
        src="/bushcraft/debris.jpg"
        title="Debris hut"
        steps={[
          "Ridge pole from a tree crotch down to the ground — body-length plus a bit.",
          "Rib sticks down both sides, touching dirt. Door just big enough to crawl.",
          "Pile leaves, duff, and dead grass until your arm disappears in it. Then add more.",
          "Stuff the inside with dry debris for a bed. You heat it with your body. No fire inside.",
          "Plug the door with a debris bundle once you are in. If you can see light through the roof, rain will find you.",
        ]}
        note="This is a sleeping bag made of the woods. Small and thick beats big and pretty."
      >
        <p>
          A-frame you bury in duff. No fire in it. Your body is the stove. If the
          pile is thin you will be wet and cold by morning.
        </p>
      </Plate>
      <Plate
        src="/bushcraft/tarp.jpg"
        title="Tarp A-frame"
        steps={[
          "Tie a ridge line between two trees, taut, about chest to head high.",
          "Throw the tarp over. Center the ridge so both sides hang even.",
          "Stake the four corners out and down. Drop the sides in wind and rain.",
          "Sleep on the uphill edge so water sheets away from you, not into the bag.",
          "Guy lines get taut-line hitches. Wet cord stretches — slide them back.",
        ]}
        note="A taut ridge is the whole trick. A sagging tarp dumps a puddle on your chest."
      >
        <p>
          Ridge line, tarp over, corners staked. Fastest real roof if you packed
          a sheet. Low sides in weather. High sides if you need a fire under the
          lip.
        </p>
      </Plate>
    </div>
  );
}

export function ToolCraftTraps() {
  return (
    <div className="grid gap-4">
      <How>
        Survival food, not sport. Small game on a trail you can prove is used.
        Check often. Dispatch clean. Eat it. Leave no set you will not return to.
        Illegal in a lot of places when you are not actually starving.
      </How>
      <Plate
        src="/bushcraft/figure4.jpg"
        title="Figure-4 deadfall"
        steps={[
          "Three sticks: vertical post, horizontal bait stick, diagonal lock. Deadfall five times the animal — a flat rock or a heavy log.",
          "Square-notch the vertical near the top, facing the deadfall. Round notches slip.",
          "Square-notch the bait stick so it seats on the vertical. Bait the far end.",
          "Square-notch the diagonal so it locks under the deadfall and onto the bait stick. The three lock like a 4.",
          "Stand the post in dirt. Ease the deadfall onto the diagonal. The lock should just hold.",
          "Test: a light tap on the bait end must drop the rock. If it will not, it will not fire on a mouse.",
        ]}
        note="Sensitive trigger. Check often. Dispatch clean. Do not leave a set you will not return to."
      >
        <p>
          Three notched sticks that lock like a 4, holding a rock or a log over
          the bait. When the animal pulls, the lock dumps. Crush, not a cage.
        </p>
      </Plate>
      <Plate
        src="/bushcraft/snare.jpg"
        title="Simple snare"
        steps={[
          "Wire if you have it. Cord works once. Make a noose that slides closed and will not reopen.",
          "Loop stands open — about a fist across for rabbit. A twig can hold the shape.",
          "Set on a run you can prove is used: tracks, droppings, a pinched trail through brush.",
          "Height: a fist off the ground for rabbit. Funnel with sticks so the animal takes the hole.",
          "Anchor to a spring sapling or a fixed stake. The noose does the catching. The anchor holds it.",
          "Check often. Do not set where a person or a dog will walk it.",
        ]}
        note="A snare you do not check is cruelty, and in most counties it is also a crime."
      >
        <p>
          A standing noose on a trail. The animal walks through, the loop
          tightens. Simple, quiet, and easy to forget — which is why you check
          it.
        </p>
      </Plate>
    </div>
  );
}

export function ToolCraftKnots() {
  return (
    <div className="grid gap-4">
      <How>
        Learn four well. Wet cord stretches. Retension. Dress the knot. A knot
        you cannot untie in the cold is a cut away later.
      </How>
      <Plate
        src="/bushcraft/bowline.jpg"
        title="Bowline"
        steps={[
          "Make a small overhand loop in the standing part — that is the rabbit hole. The working end is the rabbit.",
          "Rabbit up through the hole.",
          "Around the tree — the standing part above the hole.",
          "Back down the hole.",
          "Dress it. Pull the standing part and the loop. The working end sits inside the loop.",
        ]}
        note="Shelter tie-in, haul loop, around the waist in a pinch. Not a climbing harness."
      >
        <p>
          Fixed loop that will not slip and still unties after a load. Rabbit up
          the hole, around the tree, back down.
        </p>
      </Plate>
      <Plate
        src="/bushcraft/tautline.jpg"
        title="Taut-line hitch"
        steps={[
          "Pass the working end around the stake, or through the tarp grommet, and back along the standing part.",
          "Wrap the working end around the standing part twice (or three times) inside the loop, toward the stake.",
          "One more wrap outside the loop, away from the stake — a half hitch.",
          "Dress it snug. It should slide when you push it and lock when you load it.",
          "Guy lines and tarp ridges. Wet cord stretches — slide the hitch back toward the stake.",
        ]}
        note="If it creeps under load, add a wrap inside the loop. If it will not slide, you dressed it too far from the stake."
      >
        <p>
          Adjustable hitch on a standing line. Slides when you push it, locks
          under load. This is how you retension a tarp without untying.
        </p>
      </Plate>
      <Plate
        src="/bushcraft/clove.jpg"
        title="Clove hitch"
        steps={[
          "Wrap the rope around the pole.",
          "Cross over itself and wrap again, same direction.",
          "Tuck the working end under the second wrap so the two wraps stack and the crossing sits on top.",
          "Pull both ends. The hitch should sit flat, two turns, one X.",
        ]}
        note="Fast to a post or a ridge pole. It can creep on a smooth pole — backup with a half hitch if life hangs on it."
      >
        <p>
          Two stacked wraps that cross. The hitch you throw when you need a pole
          tied right now.
        </p>
      </Plate>
      <Plate
        src="/bushcraft/trucker.jpg"
        title="Trucker's hitch"
        steps={[
          "Anchor the standing end to one tree, or the far side of the load.",
          "In the standing part, make a slip loop (or an alpine butterfly) about a third of the way from the other tree.",
          "Pass the working end around the second tree — or through a carabiner or grommet — then back through the slip loop.",
          "Pull. You have about 2:1. The line goes taut.",
          "Lock with two half hitches on the standing part so it cannot run back.",
        ]}
        note="Ridgelines, bundles, a load on a rack. Same idea as a 2:1. Do not hang a person on it."
      >
        <p>
          Mechanical advantage for a ridgeline or a bundle. A loop in the
          standing part, the working end through it, pull, then lock.
        </p>
      </Plate>
    </div>
  );
}

export function ToolCraftSignals() {
  return (
    <div className="grid gap-4">
      <How>
        Three of anything is help. Put the signal where a bird or a truck can
        see it. Stay by it. A moving target is hard to recover.
      </How>
      <Plate src="/bushcraft/three-fire.jpg" title="Three fires">
        <p>
          Triangle or a straight line, well spaced, on open ground or a ridge.
          Day or night. One fire is a camp. Three is a call. Keep fuel staged
          so they all stay lit.
        </p>
      </Plate>
      <Plate src="/bushcraft/smoke.jpg" title="Smoke">
        <p>
          Build a hot, clean fire first. Then dump green boughs, wet leaves, or
          a little damp duff on it. You want a fat column, not a smothered pile.
          White against dark timber. Black smoke (oil, rubber) against snow.
          Pulse it with a panel if you hear an aircraft.
        </p>
      </Plate>
      <Plate src="/bushcraft/night.jpg" title="Night fire">
        <p>
          Bright, high, dry wood. Ridge or clearing. Three piles if you can.
          Save the green for day smoke. Do not stare into it and wreck your
          night vision. Keep a watch. One person on the fire, one on the noise.
        </p>
      </Plate>
    </div>
  );
}

export function ToolCraftCare() {
  return (
    <div className="grid gap-4">
      <How>
        MARCH still owns the order. This is improvised gear when the kit is gone.
        Wide, tight, timed. Do not play surgeon.
      </How>
      <Plate src="/bushcraft/splint.jpg" title="Makeshift splint">
        <p>
          Check pulse, movement, feeling before and after. Pad the bone. Rigid
          stay — stick, tent pole, folded pad — past the joint above and the
          joint below. Wrap snug, not tourniquet-tight. Recheck the fingers or
          toes. If it goes white, numb, or cold, you wrapped too hard. Loosen.
        </p>
      </Plate>
      <Plate src="/bushcraft/tq.jpg" title="Improvised tourniquet">
        <p>
          Massive limb bleed that packing will not stop. Band at least two
          fingers wide — a cravat, a belt, a cut shirt. Not paracord, not wire.
          High on the limb, not over the joint. Windlass stick in the band.
          Twist until the bright bleeding stops and the distal pulse is gone.
          Tie the windlass off. Write the time on the skin. Do not loosen it to
          “check.” A real CAT is better. This is the backup.
        </p>
      </Plate>
    </div>
  );
}

export function ToolCraftNatural() {
  return (
    <div className="grid gap-4">
      <How>
        The woods will feed a fire and dress a wound if you know what you are
        looking at. Name it before you use it. If you do not know the plant,
        leave it.
      </How>
      <Plate src="/bushcraft/tinder.jpg" title="Tinder">
        <p>
          Look up, not in the mud. Dead hanging twigs, inner bark of cedar or
          tulip poplar, birch bark even when wet, fatwood from old pine stumps,
          cattail fluff, cramp-ball fungus, a feather stick off dry heartwood.
          Make a nest. Kindling the size of matchsticks, then pencils, then
          thumbs. If the tinder will not take a spark, the fire will not take
          the night.
        </p>
      </Plate>
      <Plate src="/bushcraft/sphagnum.jpg" title="Sphagnum moss">
        <p>
          The pale green-red peat moss in bogs and seeps. Three jobs. Wet: wring
          it for residual water, then boil what you drink. Wound: rinse, press
          into a pad, cover — old armies packed it because it holds water and
          is mildly acid. Dry: it takes a spark as tinder. Skip moss from
          roadside ditches, livestock wallows, or water that smells like a
          latrine.
        </p>
      </Plate>
      <Plate src="/bushcraft/mud.jpg" title="Mud, and better">
        <p>
          Pale river clay as a last-ditch smear will knock back some sun and
          some bugs. Keep it out of eyes and open skin. Black organic muck is
          not clay — it is a wound waiting. Better, in order: clothes and shade,
          a real repellent if you have it, wood ash mixed with a little fat,
          covering up at dusk. Do not eat a plant for “bug juice” unless you
          can name it in the daylight.
        </p>
      </Plate>
    </div>
  );
}

export function ToolCraftFire() {
  return (
    <div className="grid gap-4">
      <How>
        Fire is a tool. You build it on mineral soil, you feed it in sizes, you
        boil on coals. Flames look pretty. Coals do the work.
      </How>
      <Plate src="/bushcraft/firelay.jpg" title="Fire fundamentals">
        <p>
          Heat, fuel, air. Scrape to dirt. Clear a body-length of duff. Wind at
          your back or a reflector. Tinder nest, kindling teepee, fuel staged
          before the spark. One match is a plan. Wet wood is shaved to dry
          heart. Bank coals under ash if you want fire in the morning. Kill it
          dead when you leave — drown, stir, feel.
        </p>
      </Plate>
      <Plate src="/bushcraft/boil-pot.jpg" title="Boil on the fire">
        <p>
          Hang the pot from a dingle stick or a crane over coals, not in a
          roaring flame that blacks the metal and dumps soot in the water.
          Rolling boil. A rolling boil does not make bad water good if the
          source is chemical. It kills the bugs. Keep the bail or the stick
          green so it does not burn through and dump your night.
        </p>
      </Plate>
      <Plate src="/bushcraft/boil-trash.jpg" title="Trash as a kettle">
        <p>
          Aluminum can: rinse, wire bail, hang over coals. Do not seal it. Do
          not use galvanized (zinc). PET bottle: fill all the way, suspend well
          above coals — never in the flame. The water keeps the plastic from
          melting until it boils. If it slumps, it is too close. Never a sealed
          can or bottle on heat. That is a bomb. Metal is better. Trash is a
          backup.
        </p>
      </Plate>
    </div>
  );
}
