import { useId } from "react";
import type { TemplateId } from "../modules/media/catalog";
import { templates } from "../modules/media/catalog";

export function TemplateArt({ id }: { id: TemplateId }) {
  const gradient = useId();
  const design = templates.find((item) => item.id === id)!;
  const motif = design.motif;
  const floral = [
    "flowers",
    "garden",
    "orchid",
    "rose",
    "blossom",
    "lavender",
    "bouquet",
    "olive",
  ].includes(motif);
  const sparkle = (x: number, y: number, size: number) => (
    <path
      d={`M${x} ${y - size}Q${x + 3} ${y - 3} ${x + size} ${y}Q${x + 3} ${y + 3} ${x} ${y + size}Q${x - 3} ${y + 3} ${x - size} ${y}Q${x - 3} ${y - 3} ${x} ${y - size}`}
    />
  );
  return (
    <svg
      className="card-art template-art"
      viewBox="0 0 400 520"
      fill="none"
      aria-hidden="true"
      style={{ color: design.accent }}
    >
      <defs>
        <linearGradient id={gradient} x2="1" y2="1">
          <stop stopColor={design.accent} stopOpacity=".7" />
          <stop offset=".5" stopColor={design.paper} />
          <stop offset="1" stopColor={design.accent} stopOpacity=".4" />
        </linearGradient>
      </defs>
      <rect
        x="16"
        y="16"
        width="368"
        height="488"
        rx={motif === "arch" ? 160 : 3}
        stroke="currentColor"
        opacity=".45"
      />
      <rect
        x="22"
        y="22"
        width="356"
        height="476"
        rx="2"
        stroke="currentColor"
        opacity=".16"
      />
      {floral &&
        [0, 1].map((corner) => (
          <g
            key={corner}
            transform={corner ? "translate(400 520) rotate(180)" : undefined}
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M25 196Q86 134 69 31M49 155Q109 116 122 38M58 145Q103 107 166 75" />
            {[0, 1, 2, 3].map((i) => (
              <g
                key={i}
                transform={`translate(${52 + i * 17} ${128 - i * 27}) rotate(${i * 17 - 25})`}
              >
                <path
                  d="M0 0Q-35-6-29-34Q-4-28 0 0ZM0-9Q36-12 31-40Q8-36 0-9Z"
                  fill="currentColor"
                  fillOpacity=".12"
                />
              </g>
            ))}
            {motif === "lavender"
              ? [0, 1, 2, 3, 4, 5].map((i) => (
                  <g key={i} transform={`translate(105 ${42 + i * 10})`}>
                    <ellipse
                      rx="5"
                      ry="9"
                      cx={i % 2 ? 4 : -4}
                      fill="currentColor"
                      fillOpacity=".4"
                    />
                  </g>
                ))
              : motif !== "olive" &&
                [0, 1, 2].map((i) => (
                  <g
                    key={i}
                    transform={`translate(${66 + i * 35} ${46 + i * 20})`}
                  >
                    {[0, 60, 120, 180, 240, 300].map((angle) => (
                      <ellipse
                        key={angle}
                        cy="-14"
                        rx={motif === "orchid" ? 12 : 8}
                        ry="20"
                        transform={`rotate(${angle})`}
                        fill={`url(#${gradient})`}
                        strokeOpacity=".65"
                      />
                    ))}
                    <circle r="5" fill="currentColor" fillOpacity=".6" />
                  </g>
                ))}
          </g>
        ))}
      {motif === "rings" && (
        <g stroke="currentColor" strokeWidth="2">
          <circle cx="179" cy="92" r="32" />
          <circle cx="222" cy="92" r="32" />
          <path d="M209 53L222 39L235 53L222 67ZM169 148Q200 170 231 148" />
        </g>
      )}
      {(motif === "arch" || motif === "garden-arch") && (
        <g stroke="currentColor" strokeWidth="1.3">
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M${45 + i * 15} 493V184a${155 - i * 15} ${155 - i * 15} 0 0 1 ${310 - i * 30} 0V493`}
              opacity={0.25 + i * 0.13}
            />
          ))}
          {motif === "garden-arch" && (
            <path
              d="M56 416Q9 307 61 196Q99 87 199 66M344 416Q386 294 337 197Q302 93 203 66"
              strokeWidth="4"
              strokeDasharray="4 13"
              strokeLinecap="round"
            />
          )}
        </g>
      )}
      {(motif === "graduate" || motif === "graduate-stars") && (
        <g stroke="currentColor" strokeWidth="2">
          <path
            d="M136 74L200 45L264 74L200 105ZM155 84V115Q199 141 244 115V84M257 80V126"
            fill="currentColor"
            fillOpacity=".12"
          />
          <circle cx="257" cy="130" r="4" fill="currentColor" />
          <path d="M135 448Q200 431 267 448L260 470Q200 452 140 470Z" />
          <path d="M198 439V465M205 439V465" />
          {motif === "graduate-stars" && (
            <g fill="currentColor">
              {sparkle(89, 111, 13)}
              {sparkle(307, 68, 17)}
              {sparkle(302, 411, 10)}
            </g>
          )}
        </g>
      )}
      {motif === "sixteen" && (
        <g fill="currentColor">
          <text
            x="200"
            y="127"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="88"
            opacity=".8"
          >
            16
          </text>
          {sparkle(98, 84, 19)}
          {sparkle(300, 107, 12)}
          <path
            d="M106 454Q200 433 294 454"
            fill="none"
            stroke="currentColor"
          />
        </g>
      )}
      {(motif === "stars" || motif === "moon" || motif === "baby") && (
        <g fill="currentColor">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <g key={i}>
              {sparkle(
                38 + ((i * 47) % 325),
                i % 2 ? 464 : 57,
                9 + (i % 3) * 3,
              )}
            </g>
          ))}
          {motif !== "stars" && (
            <path
              d="M216 37a43 43 0 1 0 39 55a36 36 0 0 1-39-55Z"
              fillOpacity=".4"
            />
          )}
        </g>
      )}
      {(motif === "bow" || motif === "pearls") && (
        <g stroke="currentColor" strokeWidth="1.5">
          <path
            d="M200 83Q120 9 130 70Q129 119 200 83Q278 7 269 72Q267 120 200 83ZM190 84L150 141L180 134L191 153L202 90L221 151L230 133L255 144L210 83Z"
            fill={`url(#${gradient})`}
          />
          {motif === "pearls" &&
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <g key={i}>
                <circle
                  cx="34"
                  cy={48 + i * 46}
                  r="3"
                  fill="currentColor"
                  fillOpacity=".3"
                />
                <circle
                  cx="366"
                  cy={48 + i * 46}
                  r="3"
                  fill="currentColor"
                  fillOpacity=".3"
                />
              </g>
            ))}
        </g>
      )}
      {motif === "citrus" &&
        [0, 1].map((i) => (
          <g
            key={i}
            transform={i ? "translate(400 520) rotate(180)" : undefined}
            stroke="currentColor"
          >
            <path d="M28 137Q62 62 154 31" strokeWidth="2" />
            {[0, 1, 2].map((j) => (
              <g
                key={j}
                transform={`translate(${51 + j * 33} ${101 - j * 23})`}
              >
                <circle r="17" fill="currentColor" fillOpacity=".25" />
                <path
                  d="M-4-19Q-27-44-10-45Q5-41-4-19ZM7-18Q40-31 30-10Q17 1 7-18Z"
                  fill="currentColor"
                  fillOpacity=".12"
                />
              </g>
            ))}
          </g>
        ))}
      {motif === "palm" && (
        <g stroke="currentColor" strokeWidth="1.5">
          <circle
            cx="294"
            cy="89"
            r="44"
            fill="currentColor"
            fillOpacity=".15"
            stroke="none"
          />
          {[0, 1].map((i) => (
            <g
              key={i}
              transform={i ? "translate(400 520) rotate(180)" : undefined}
            >
              <path d="M42 188Q73 120 65 55" />
              {[-2, -1, 0, 1, 2].map((j) => (
                <path
                  key={j}
                  d={`M65 55Q${82 + j * 15} ${24 + Math.abs(j) * 8} ${127 + j * 24} ${72 + j * 9}Q${83 + j * 9} ${47 + Math.abs(j) * 10} 65 55Z`}
                  fill="currentColor"
                  fillOpacity=".15"
                />
              ))}
            </g>
          ))}
        </g>
      )}
      {motif === "waves" && (
        <g stroke="currentColor" strokeWidth="1.5">
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <path
                d={`M24 ${53 + i * 13}Q85 ${24 + i * 13} 145 ${53 + i * 13}T267 ${53 + i * 13}T389 ${53 + i * 13}`}
                opacity={0.2 + i * 0.15}
              />
              <path
                d={`M12 ${448 + i * 13}Q73 ${417 + i * 13} 134 ${448 + i * 13}T256 ${448 + i * 13}T378 ${448 + i * 13}`}
                opacity={0.2 + i * 0.15}
              />
            </g>
          ))}
        </g>
      )}
      {motif === "confetti" && (
        <g fill="currentColor">
          {Array.from({ length: 32 }, (_, i) => (
            <rect
              key={i}
              x={31 + ((i * 83) % 336)}
              y={i % 2 ? 435 + ((i * 17) % 50) : 32 + ((i * 11) % 54)}
              width="4"
              height="12"
              rx="1"
              transform={`rotate(${i * 19} ${31 + ((i * 83) % 336)} ${i % 2 ? 454 : 50})`}
              opacity={0.25 + (i % 3) * 0.18}
            />
          ))}
        </g>
      )}
      {motif === "cake" && (
        <g stroke="currentColor" strokeWidth="1.7">
          <path
            d="M142 109H258V142H142ZM165 84H235V109H165ZM131 143H269M183 84V64M217 84V64"
            fill="currentColor"
            fillOpacity=".12"
          />
          <path
            d="M180 56Q184 42 188 56Q185 63 180 56ZM214 56Q218 42 222 56Q219 63 214 56Z"
            fill="currentColor"
          />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${151 + i * 35} 112q8 18 17 0`} />
          ))}
        </g>
      )}
      {motif === "frame" && (
        <g stroke="currentColor" strokeWidth="1.2">
          <path d="M66 76H334V444H66ZM43 95V45H94M306 45H357V95M43 425V475H94M306 475H357V425" />
          <circle cx="200" cy="64" r="4" />
          <circle cx="200" cy="456" r="4" />
        </g>
      )}
    </svg>
  );
}
