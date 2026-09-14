import { How } from "@/components/result";
import { asset } from "@/lib/survbox/asset";

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
      <img src={asset(src)} alt={title} className="aspect-[4/3] w-full object-cover" />
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

function SplintDiagram() {
  return (
    <svg
      viewBox="0 0 360 158"
      className="w-full"
      role="img"
      aria-label="Splint spans the joint above and the joint below the break."
    >
      <text x="180" y="16" textAnchor="middle" className="fill-subtle" fontSize="9" fontFamily="IBM Plex Sans, sans-serif" letterSpacing="2.4">
        PAST BOTH JOINTS
      </text>
      {/* stick — longer than the arm */}
      <rect x="28" y="38" width="304" height="10" rx="5" className="fill-accent" />
      <text x="42" y="34" className="fill-muted" fontSize="8" fontFamily="IBM Plex Sans, sans-serif">
        PAST
      </text>
      <text x="292" y="34" className="fill-muted" fontSize="8" fontFamily="IBM Plex Sans, sans-serif">
        PAST
      </text>
      {/* padding */}
      <rect x="78" y="50" width="188" height="8" rx="2" className="fill-warn/70" />
      {/* forearm */}
      <rect x="78" y="60" width="188" height="28" rx="14" className="fill-muted/45" />
      {/* elbow joint */}
      <circle cx="84" cy="74" r="16" className="fill-fg/80" />
      <circle cx="84" cy="74" r="7" className="fill-bg" />
      {/* wrist joint */}
      <circle cx="260" cy="74" r="14" className="fill-fg/80" />
      <circle cx="260" cy="74" r="6" className="fill-bg" />
      {/* hand */}
      <rect x="268" y="64" width="36" height="20" rx="8" className="fill-muted/50" />
      {/* wraps */}
      <rect x="118" y="34" width="14" height="62" rx="2" className="fill-warn" />
      <rect x="168" y="34" width="14" height="62" rx="2" className="fill-warn" />
      <rect x="218" y="34" width="14" height="62" rx="2" className="fill-warn" />
      <text x="84" y="118" textAnchor="middle" className="fill-muted" fontSize="9" fontFamily="IBM Plex Sans, sans-serif" letterSpacing="1.6">
        ELBOW
      </text>
      <text x="174" y="118" textAnchor="middle" className="fill-subtle" fontSize="9" fontFamily="IBM Plex Sans, sans-serif" letterSpacing="1.6">
        BREAK
      </text>
      <text x="260" y="118" textAnchor="middle" className="fill-muted" fontSize="9" fontFamily="IBM Plex Sans, sans-serif" letterSpacing="1.6">
        WRIST
      </text>
      <text x="180" y="144" textAnchor="middle" className="fill-subtle" fontSize="10" fontFamily="IBM Plex Sans, sans-serif">
        Pad. Stick. Wrap. Leave the fingers out.
      </text>
    </svg>
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
        Learn these well. Wet cord stretches. Retension. Dress the knot. A knot
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
        src="/bushcraft/figure8.jpg"
        title="Figure-8 knot"
        steps={[
          "Make a loop in the working end, then give it one extra twist so the rope lays as an 8.",
          "Pass the working end through the top hole of the 8, the same way you would finish an overhand.",
          "Dress it. The two turns sit parallel. No crossed strands.",
          "Cinch. Leave a tail a few inches long so it cannot creep out.",
        ]}
        note="Stopper. Keeps a line from pulling through a grommet or a device. Not a loop. Not a harness tie-in."
      >
        <p>
          The 8 you can see at a glance. Stronger and easier to inspect than an
          overhand. This is the stopper, not the loop.
        </p>
      </Plate>
      <Plate
        src="/bushcraft/fig8-bight.jpg"
        title="Figure-8 on a bight"
        steps={[
          "Double the rope. That doubled section is the bight — a fold, not a bite.",
          "Tie a figure-8 with the doubled rope: twist into an 8, then feed the bight through the top hole.",
          "Dress it. Parallel strands. Set the loop to the size you need before you cinch.",
          "Cinch hard. Tail long enough that it cannot creep out.",
        ]}
        note="Fixed loop for a carabiner, a haul, a clip-in. Stronger and easier to inspect than a bowline. Harder to untie after a heavy load."
      >
        <p>
          Same figure-8, tied on a doubled rope, so you get a loop. This is the
          one climbers clip. A bight is a fold in the rope.
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
        Three of anything is help. Put the signal where a plane or a truck can
        see it. Stay by it. A moving person is hard to find.
      </How>
      <Plate
        src="/bushcraft/three-fire.jpg"
        title="Three fires"
        steps={[
          "Triangle or a straight line, well spaced, on a ridge or in a clearing.",
          "One fire is a camp. Three is a call.",
          "Stage fuel so all three stay lit. Light them together when you hear an aircraft.",
        ]}
        note="Night: bright dry wood. Day: add green for smoke."
      >
        <p>The oldest distress mark that still works.</p>
      </Plate>
      <Plate
        src="/bushcraft/smoke.jpg"
        title="Smoke"
        steps={[
          "Build a hot, clean fire first. You need a column, not a smothered pile.",
          "Dump green boughs, wet leaves, or damp duff on it.",
          "White smoke against dark timber. Black smoke (oil, rubber) against snow.",
          "If you hear an aircraft, uncover and recover the fire so the column pulses.",
        ]}
      >
        <p>Day signal. Fat and high beats a wisp in the canopy.</p>
      </Plate>
      <Plate
        src="/bushcraft/night.jpg"
        title="Night fire"
        steps={[
          "Bright, high, dry wood. Ridge or clearing. Three piles if you can.",
          "Save the green for day smoke.",
          "Do not stare into it — you wreck night vision.",
          "One person on the fire. One on the noise.",
        ]}
      >
        <p>Light is the night signal. Keep a watch.</p>
      </Plate>
    </div>
  );
}

export function ToolCraftCare() {
  return (
    <div className="grid gap-4">
      <How>
        MARCH still owns the order. Bleed first. This page is improvised gear
        when the kit is gone. Wide, tight, timed. You are not setting bones.
      </How>

      <article className="overflow-hidden rounded-xl border border-border bg-surface">
        <img
          src={asset("/bushcraft/splint.jpg")}
          alt="Improvised forearm splint: padded shirt, stick along the bone, cloth wraps"
          className="aspect-[4/3] w-full object-cover object-[50%_35%]"
        />
        <div className="grid gap-4 p-4">
          <div>
            <p className="font-display text-[11px] font-semibold tracking-[0.22em] text-muted uppercase">
              Field procedure
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-wide">Makeshift splint</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Pad the bone. Rigid stay past both joints. Recheck the fingers.
            </p>
          </div>

          <div className="overflow-hidden rounded-md border border-border">
            <p className="bg-raised px-3 py-2 font-display text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
              CSM — before you wrap, after you wrap
            </p>
            <div className="grid grid-cols-3 divide-x divide-border">
              {[
                { k: "Pulse", v: "Distal to the break." },
                { k: "Feeling", v: "Pinch a finger or toe." },
                { k: "Move", v: "Wiggle. Do not lift." },
              ].map((c) => (
                <div key={c.k} className="grid gap-1 p-3">
                  <p className="font-display text-sm font-semibold tracking-wide">{c.k}</p>
                  <p className="text-xs leading-relaxed text-muted">{c.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-bg px-2 py-3">
            <SplintDiagram />
          </div>

          <ol className="grid gap-2">
            {[
              "Expose the limb. Cut clothes around a wound. Do not pull bone back through skin.",
              "CSM now. Pulse, pinch, wiggle. Remember it.",
              "Pad. Shirt, sock, moss in cloth. No stick or bark on bare skin.",
              "Rigid stay past the joint above and the joint below. Stick, tent pole, folded pad, the other leg.",
              "Wrap snug. Cravats, torn shirt, tape. Leave gaps so you can see color. This is not a tourniquet.",
              "CSM again. White, numb, or cold — loosen.",
              "Arm: sling and swathe so it cannot swing. Leg: they do not walk on it.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 w-6 shrink-0 font-mono text-xs tabular-nums text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-raised p-3">
              <p className="font-display text-sm font-semibold tracking-wide">Arm</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Elbow to knuckles. Sling around the neck. Swathe the upper arm to
                the chest so the whole thing is dead to swing.
              </p>
            </div>
            <div className="rounded-md border border-border bg-raised p-3">
              <p className="font-display text-sm font-semibold tracking-wide">Leg</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Above the knee to past the ankle. Buddy-tape to the other leg if
                that is all you have. They ride. They do not hike out on it.
              </p>
            </div>
          </div>

          <img
            src={asset("/bushcraft/splint-leg.jpg")}
            alt="Three real wilderness lower-leg splints: foam pad, clothing, stick and cloth"
            className="aspect-[4/3] w-full rounded-md object-cover"
          />

          <div className="rounded-md border border-danger/40 p-3">
            <p className="font-display text-sm font-semibold tracking-wide text-danger">Do not</p>
            <ul className="mt-2 grid gap-1.5 text-sm leading-relaxed">
              <li>Do not “set” a fracture unless there is no pulse and you know that job.</li>
              <li>Do not wrap over an open hole — cover it first, then splint around it.</li>
              <li>Do not hide the fingers or toes. You need to see them.</li>
            </ul>
          </div>
        </div>
      </article>

      <Plate
        src="/bushcraft/tq.jpg"
        title="Improvised tourniquet"
        steps={[
          "Massive limb bleed that packing will not stop. That is the only reason.",
          "Band at least two fingers wide. Cravat, belt, cut shirt. Not paracord. Not wire. Not a shoelace.",
          "High on the limb. Not over the joint. Not on the wound.",
          "Stick through the band. Twist until the bright bleeding stops and the pulse below is gone.",
          "Tie the stick off so it cannot unwind. Write the time on the skin.",
          "Do not loosen it to “check.” A CAT is better. This is the backup.",
        ]}
        note="Wide. Tight. Timed. If you can pack it and hold pressure, do that first."
      >
        <p>
          A wide band and a windlass. The stick in the photo is the windlass —
          you twist it. Not a splint.
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
        looking at. Name it first. If you do not know the plant, leave it.
      </How>
      <Plate
        src="/bushcraft/tinder.jpg"
        title="Tinder"
        steps={[
          "Look up, not in the mud. Dead hanging twigs stay drier.",
          "Take: inner bark of cedar or tulip poplar, birch bark even when wet, fatwood from old pine stumps, cattail fluff, cramp-ball fungus, a feather stick off dry heartwood.",
          "Make a nest. Kindling the size of matchsticks, then pencils, then thumbs.",
        ]}
        note="If the tinder will not take a spark, the fire will not take the night."
      >
        <p>Dry, fine, and a lot of it. The nest is the whole trick.</p>
      </Plate>
      <Plate
        src="/bushcraft/sphagnum.jpg"
        title="Sphagnum moss"
        steps={[
          "Pale green to red peat moss in bogs and seeps. Soft cushions, not star-shaped haircap moss.",
          "Wet: wring it, then boil what you drink. Residual water only — not a clean source.",
          "Wound: rinse, press into a pad, cover. Old armies packed it because it holds water and is mildly acid.",
          "Dry: it takes a spark as tinder.",
        ]}
        note="Skip moss from roadside ditches, livestock wallows, or water that smells like a latrine."
      >
        <p>Three jobs: water, wound pad, tinder. Know it before you grab it.</p>
      </Plate>
      <Plate
        src="/bushcraft/mud.jpg"
        title="Mud, and better"
        steps={[
          "Pale river clay as a last-ditch smear will knock back some sun and some bugs. Keep it out of eyes and open skin.",
          "Black organic muck is not clay. It is a wound waiting.",
          "Better, in order: clothes and shade. Real repellent if you have it. Wood ash mixed with a little fat. Cover up at dusk.",
        ]}
        note="Do not mash a plant onto your skin as repellent unless you can name it in daylight."
      >
        <p>Clay is a smear. Muck is dirt in a cut.</p>
      </Plate>
    </div>
  );
}

export function ToolCraftFire() {
  return (
    <div className="grid gap-4">
      <How>
        Fire is a tool. Build it on mineral soil. Feed it in sizes. Boil on
        coals. Flames look pretty. Coals do the work.
      </How>
      <Plate
        src="/bushcraft/firelay.jpg"
        title="Fire fundamentals"
        steps={[
          "Heat, fuel, air. Scrape to dirt. Clear a body-length of duff.",
          "Wind at your back, or a reflector.",
          "Tinder nest. Kindling teepee. Fuel staged before the spark.",
          "One match is a plan. Wet wood is shaved to dry heart.",
          "Bank coals under ash if you want fire in the morning.",
          "Kill it dead when you leave — drown, stir, feel.",
        ]}
      >
        <p>Build the pile before you light it. Size up, not all at once.</p>
      </Plate>
      <Plate
        src="/bushcraft/boil-pot.jpg"
        title="Boil on the fire"
        steps={[
          "Hang the pot from a dingle stick or a crane over coals, not in a roaring flame.",
          "Wait for a rolling boil. Bugs die. Chemical water stays chemical.",
          "Once it rolls: 1 minute. Above 2000 m / 6500 ft: 3 minutes.",
          "Keep the bail or the stick green so it does not burn through and dump your night.",
        ]}
      >
        <p>Coals, not flame. Flame blacks the pot and dumps soot in the water.</p>
      </Plate>
      <Plate
        src="/bushcraft/boil-trash.jpg"
        title="Trash as a kettle"
        steps={[
          "Aluminum can: rinse, wire bail, hang over coals. Do not seal it. Do not use galvanized (zinc).",
          "PET bottle: fill all the way, suspend well above coals — never in the flame. The water keeps the plastic from melting until it boils. If it slumps, it is too close.",
          "Never a sealed can or bottle on heat. That is a bomb.",
        ]}
        note="Metal is better. Trash is a backup."
      >
        <p>Open vessel. Coals, not flame. Watch it.</p>
      </Plate>
    </div>
  );
}
