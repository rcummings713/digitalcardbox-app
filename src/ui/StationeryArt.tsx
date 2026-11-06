import { useId } from "react";
import type { StationeryLayout } from "../modules/media/stationery-catalog";
// Original vector stationery with four compositions, designed around editable text.
export function StationeryArt({
  motif,
  layout,
  paper,
  accent,
}: {
  motif: string;
  layout: StationeryLayout;
  paper: string;
  accent: string;
}) {
  const id = useId();
  const theme = motif.replace("atelier-", "");
  const leaf = (x: number, y: number, rotate = 0) => (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path
        d="M0 0Q-26-35-12-57Q14-47 0 0ZM0-7Q23-43 42-35Q44-11 0-7Z"
        fill="currentColor"
        fillOpacity=".17"
      />
      <path d="M0 7V-40M0-7L26-26" stroke="currentColor" strokeWidth=".9" />
    </g>
  );
  const blossom = (x: number, y: number, size = 1) => (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      {[0, 60, 120, 180, 240, 300].map((r) => (
        <path
          key={r}
          transform={`rotate(${r})`}
          d="M0 0C-23-8-24-34-10-37C8-42 14-14 0 0Z"
          fill={`url(#${id}-petal)`}
          stroke="currentColor"
          strokeWidth=".6"
        />
      ))}
      <circle r="5" fill="currentColor" fillOpacity=".7" />
    </g>
  );
  const sprig = (x: number, y: number, rotate = 0) => (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path d="M0 110Q-8 45 18-5" stroke="currentColor" strokeWidth="1.1" />
      {[0, 1, 2].map((n) => (
        <g key={n}>{leaf(4 + n * 3, 93 - n * 30, -20 + n * 10)}</g>
      ))}
    </g>
  );
  return (
    <svg
      className="card-art template-art stationery-art"
      viewBox="0 0 400 520"
      fill="none"
      aria-hidden="true"
      style={{ color: accent }}
    >
      <defs>
        <linearGradient id={`${id}-petal`} x2="1" y2="1">
          <stop stopColor="currentColor" stopOpacity=".28" />
          <stop offset=".48" stopColor={paper} />
          <stop offset="1" stopColor="currentColor" stopOpacity=".12" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="currentColor" stopOpacity=".13" />
          <stop offset="1" stopColor={paper} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-disco`}>
          <circle cx="200" cy="62" r="43" />
        </clipPath>
      </defs>
      {layout === "portrait" && (
        <g stroke="currentColor">
          <rect x="17" y="17" width="366" height="486" rx="3" opacity=".48" />
          <rect x="24" y="24" width="352" height="472" rx="2" opacity=".16" />
        </g>
      )}
      {layout === "editorial" && (
        <>
          <rect width="400" height="85" fill="currentColor" fillOpacity=".07" />
          <path
            d="M28 100H372M28 478H372"
            stroke="currentColor"
            strokeWidth=".8"
            opacity=".55"
          />
          <circle cx="345" cy="488" r="75" fill={`url(#${id}-glow)`} />
        </>
      )}
      {layout === "arch" && (
        <g stroke="currentColor">
          <path
            d="M45 492V170a155 155 0 0 1 310 0V492ZM54 492V170a146 146 0 0 1 292 0V492Z"
            opacity=".48"
          />
          <path d="M61 488H339" opacity=".25" />
        </g>
      )}
      {layout === "postcard" && (
        <g stroke="currentColor">
          <rect
            x="16"
            y="16"
            width="368"
            height="488"
            rx="5"
            strokeDasharray="1 9"
            strokeLinecap="round"
            strokeWidth="3"
            opacity=".4"
          />
          <rect x="29" y="29" width="342" height="462" opacity=".22" />
          <path d="M49 119H351M49 411H351" opacity=".25" />
        </g>
      )}
      {[
        "botanical",
        "meadow",
        "laurel",
        "olive",
        "marigold",
        "porcelain",
      ].includes(theme) && (
        <>
          {sprig(39, 53, -20)}
          <g transform="translate(422 550) rotate(180)">{sprig(39, 53, -20)}</g>
          {theme !== "olive" && theme !== "laurel" && (
            <>
              {blossom(75, 61, theme === "marigold" ? 1.1 : 0.66)}
              {blossom(350, 488, 0.48)}
            </>
          )}
          {theme === "meadow" && (
            <g stroke="currentColor" strokeWidth="1.1">
              <path d="M23 490Q44 409 71 439M30 490Q90 412 112 460M378 110Q353 32 307 57" />
              {blossom(71, 436, 0.28)}
              {blossom(111, 459, 0.22)}
            </g>
          )}
          {theme === "porcelain" && (
            <g stroke="currentColor" opacity=".55">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <g key={n}>
                  <path
                    d={`M${30 + n * 62} 21q15 17 30 0M${30 + n * 62} 499q15-17 30 0`}
                  />
                  <circle cx={46 + n * 62} cy="33" r="2" />
                  <circle cx={46 + n * 62} cy="487" r="2" />
                </g>
              ))}
            </g>
          )}
          {theme === "laurel" && (
            <g transform="translate(184 62)">
              {leaf(-4, 36, -45)}
              {leaf(30, 36, 45)}
            </g>
          )}
        </>
      )}
      {theme === "linen" && (
        <>
          <path
            d="M44 81Q105 33 159 60M242 463Q297 491 355 450"
            stroke="currentColor"
            strokeWidth=".8"
          />
          <circle cx="200" cy="78" r="3" fill="currentColor" />
          <circle cx="200" cy="451" r="3" fill="currentColor" />
        </>
      )}
      {theme === "citrus" &&
        [false, true].map((reverse) => (
          <g
            key={String(reverse)}
            transform={reverse ? "translate(400 520) rotate(180)" : undefined}
            stroke="currentColor"
          >
            <path d="M29 127Q54 59 131 36" strokeWidth="1.3" />
            {[0, 1, 2].map((n) => (
              <g
                key={n}
                transform={`translate(${51 + n * 30} ${99 - n * 25}) rotate(-34)`}
              >
                <ellipse
                  rx="15"
                  ry="21"
                  fill="currentColor"
                  fillOpacity=".24"
                />
                <path d="M-9-2Q-10-12-4-15" opacity=".7" />
                {leaf(3, -18, 75)}
              </g>
            ))}
          </g>
        ))}
      {theme === "deco" && (
        <g stroke="currentColor" strokeWidth="1.2">
          <path d="M37 144V57H78V33H322V57H363V144M37 376V463H78V487H322V463H363V376M163 78L200 45L237 78L200 111Z" />
          <path d="M175 78L200 57L225 78L200 99Z" opacity=".5" />
        </g>
      )}
      {theme === "ribbon" && (
        <g stroke="currentColor" strokeWidth="1.2">
          <path
            d="M200 67C148 10 115 42 141 75C157 92 191 78 200 67C247 8 285 43 258 76C239 94 209 77 200 67ZM194 72L161 143L187 130L199 80L214 139L224 125L241 141L207 73"
            fill={`url(#${id}-petal)`}
          />
          <path d="M55 464Q200 438 345 464" opacity=".5" />
        </g>
      )}
      {theme === "celestial" && (
        <g fill="currentColor">
          <path
            d="M220 29a45 45 0 1 0 39 68a38 38 0 0 1-39-68Z"
            opacity=".65"
          />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
            <g
              key={n}
              transform={`translate(${45 + ((n * 47) % 315)} ${n % 2 ? 467 : 50 + (n % 3) * 12})`}
            >
              <path d="M0-7L2-2L7 0L2 2L0 7L-2 2L-7 0L-2-2Z" opacity=".7" />
            </g>
          ))}
        </g>
      )}
      {theme === "teddy" && (
        <g transform="translate(200 69)" stroke="currentColor">
          <circle cx="-29" cy="-22" r="17" fill={`url(#${id}-petal)`} />
          <circle cx="29" cy="-22" r="17" fill={`url(#${id}-petal)`} />
          <ellipse rx="38" ry="34" fill={paper} />
          <ellipse
            cy="13"
            rx="15"
            ry="11"
            fill="currentColor"
            fillOpacity=".12"
          />
          <circle cx="-13" cy="-2" r="2" fill="currentColor" />
          <circle cx="13" cy="-2" r="2" fill="currentColor" />
          <path d="M-4 9Q0 5 4 9L0 13ZM0 13V18M-8 18Q0 24 8 18" />
        </g>
      )}
      {theme === "rainbow" && (
        <g stroke="currentColor" strokeLinecap="round">
          {[0, 1, 2].map((n) => (
            <path
              key={n}
              d={`M${157 + n * 12} 98V76a${43 - n * 12} ${43 - n * 12} 0 0 1 ${86 - n * 24} 0V98`}
              strokeWidth="8"
              opacity={0.15 + n * 0.18}
            />
          ))}
          <path
            d="M46 469Q70 436 94 469Q120 443 138 469M270 46Q289 23 307 46Q326 24 345 46"
            strokeWidth="1.2"
            opacity=".5"
          />
        </g>
      )}
      {theme === "cherry" && (
        <g stroke="currentColor">
          <path
            d="M180 80Q188 42 223 34M224 34Q233 60 228 85"
            strokeWidth="1.5"
          />
          <circle
            cx="178"
            cy="91"
            r="18"
            fill="currentColor"
            fillOpacity=".55"
          />
          <circle
            cx="228"
            cy="98"
            r="19"
            fill="currentColor"
            fillOpacity=".4"
          />
          {leaf(219, 37, 80)}
        </g>
      )}
      {theme === "disco" && (
        <g>
          <circle
            cx="200"
            cy="62"
            r="43"
            fill={`url(#${id}-petal)`}
            stroke="currentColor"
          />
          <g
            clipPath={`url(#${id}-disco)`}
            stroke="currentColor"
            strokeWidth=".7"
            opacity=".55"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <g key={n}>
                <ellipse cx="200" cy="62" rx={9 + n * 9} ry="43" />
                <path d={`M153 ${32 + n * 15}H247`} />
              </g>
            ))}
          </g>
          <path
            d="M200 0V19M119 48h14m-7-7v14M272 93h14m-7-7v14"
            stroke="currentColor"
          />
        </g>
      )}
      {theme === "confetti" && (
        <g fill="currentColor">
          {Array.from({ length: 28 }, (_, n) => (
            <rect
              key={n}
              x={33 + ((n * 61) % 335)}
              y={n % 2 ? 452 + ((n * 7) % 35) : 31 + ((n * 11) % 45)}
              width="3"
              height="10"
              rx="1"
              opacity={0.25 + (n % 3) * 0.15}
              transform={`rotate(${n * 17} ${33 + ((n * 61) % 335)} ${n % 2 ? 466 : 50})`}
            />
          ))}
        </g>
      )}
      {theme === "diploma" && (
        <g stroke="currentColor" strokeWidth="1.4">
          <path
            d="M143 64L200 37L257 64L200 91ZM163 74V101Q200 124 237 101V74M253 68V112M152 452Q200 434 250 452L244 474Q200 458 157 474Z"
            fill="currentColor"
            fillOpacity=".12"
          />
          <path d="M197 444V468M205 444V468" />
        </g>
      )}
      {theme === "candle" && (
        <g stroke="currentColor">
          <path d="M186 62H214V113H186ZM178 115H222M200 59V49" />
          <path
            d="M200 20Q181 40 200 47Q217 39 200 20Z"
            fill="currentColor"
            fillOpacity=".3"
          />
          {sprig(40, 62, -25)}
          <g transform="translate(400 520) rotate(180)">{sprig(40, 62, -25)}</g>
        </g>
      )}
      {theme === "home" && (
        <g stroke="currentColor" strokeWidth="1.3">
          <path d="M157 71L200 37L243 71M166 66V111H234V66M193 111V87H209V111M176 75H184V84H176M217 75H225V84H217" />
          {sprig(38, 70, -30)}
        </g>
      )}
      {theme === "sunburst" && (
        <g stroke="currentColor">
          <circle
            cx="200"
            cy="67"
            r="21"
            fill="currentColor"
            fillOpacity=".12"
          />
          {Array.from({ length: 16 }, (_, n) => (
            <path
              key={n}
              d="M200 32V21"
              transform={`rotate(${n * 22.5} 200 67)`}
            />
          ))}
          <path d="M83 464Q200 438 317 464" opacity=".4" />
        </g>
      )}
    </svg>
  );
}
