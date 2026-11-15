/** Original vector illustration. Only trusted motifs and bounded hex colors enter SVG. */
export function studioArtwork(
  key: string,
  colors: { paper: string; ink: string; accent: string },
): string {
  const { paper, ink, accent } = colors;
  if (![paper, ink, accent].every((v) => /^#[a-f0-9]{6}$/i.test(v)))
    throw new Error("Invalid stationery color.");
  const line = (d: string, color = accent, width = 1, opacity = 1) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    radius = 0,
  ) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" rx="${radius}"/>`;
  const circle = (x: number, y: number, r: number, fill: string) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  const star = (x: number, y: number, r = 5, color = accent) =>
    `<path d="M${x} ${y - r}Q${x + 1} ${y - 1} ${x + r} ${y}Q${x + 1} ${y + 1} ${x} ${y + r}Q${x - 1} ${y + 1} ${x - r} ${y}Q${x - 1} ${y - 1} ${x} ${y - r}" fill="${color}"/>`;
  const flower = (
    x: number,
    y: number,
    size: number,
    color: string,
    petals = 9,
  ) =>
    `<g transform="translate(${x} ${y}) scale(${size})">${Array.from({ length: petals }, (_, i) => `<g transform="rotate(${(i * 360) / petals})"><path d="M0 0C-13-10-17-29-5-34C8-38 16-22 0 0" fill="${color}" stroke="${ink}" stroke-opacity=".18" stroke-width=".65"/>${line("M0-3Q-3-16-4-28", paper, 0.6, 0.55)}</g>`).join("")}${circle(0, 0, 7, accent)}${Array.from({ length: 8 }, (_, i) => circle(Math.cos(i) * 4, Math.sin(i) * 4, 0.7, paper)).join("")}</g>`;
  const leaf = (
    x: number,
    y: number,
    angle: number,
    scale = 1,
    color = accent,
  ) =>
    `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})"><path d="M0 0C-19-12-18-34-2-49C9-30 15-12 0 0" fill="${color}" fill-opacity=".4" stroke="${color}" stroke-width=".8"/>${line("M0 0Q-3-20-2-45", color, 0.8)}${Array.from({ length: 5 }, (_, i) => line(`M-2 ${-7 - i * 7}l${i % 2 ? 8 : -8} -6`, color, 0.5, 0.65)).join("")}</g>`;
  const branch = (
    x: number,
    y: number,
    angle: number,
    scale = 1,
    color = accent,
  ) =>
    `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${line("M0 0C12-50-10-92 4-145", color, 1.2)}${Array.from({ length: 5 }, (_, i) => leaf(i % 2 ? 2 : 4, -12 - i * 25, i % 2 ? 48 : -48, 0.6, color)).join("")}</g>`;
  const rule = (y: number, from = 65, to = 335, color = accent) =>
    line(`M${from} ${y}H${to}`, color, 0.7, 0.7);
  const arch = (inset: number, color = accent, width = 1) =>
    line(
      `M${inset} 525V170A${200 - inset} ${200 - inset} 0 0 1 ${400 - inset} 170V525Z`,
      color,
      width,
    );
  const bow = (x: number, y: number, scale: number, color: string) =>
    `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-4 0C-30-37-73-40-72-12C-71 15-31 17-4 0ZM4 0C30-37 73-40 72-12C71 15 31 17 4 0Z" fill="${color}" stroke="${accent}" stroke-width=".6"/><path d="M-4 1L-30 54L-12 47L-5 59L4 2M4 1L30 54L12 47L5 59L-4 2" fill="${color}" stroke="${accent}" stroke-width=".6"/>${line("M-56-15Q-30-20-4 0M56-15Q30-20 4 0M-50 7Q-26 12-4 1M50 7Q26 12 4 1", "#aa9a89", 0.7, 0.65)}${rect(-6, -7, 12, 16, color, 3)}</g>`;
  let art = "";
  switch (key) {
    case "black-tie": {
      art =
        rect(0, 0, 400, 560, paper) +
        rect(18, 18, 364, 524, "#ffffff03") +
        line("M27 27H373V533H27ZM34 34H366V526H34", accent, 0.7, 0.8);
      for (const [x, y, angle] of [
        [35, 35, 0],
        [365, 35, 90],
        [365, 525, 180],
        [35, 525, 270],
      ])
        art += `<g transform="translate(${x} ${y}) rotate(${angle})">${Array.from({ length: 10 }, (_, i) => line(`M0 0L${Math.sin(((i + 1) * Math.PI) / 22) * 67} ${Math.cos(((i + 1) * Math.PI) / 22) * 67}`, accent, 0.7, 0.8)).join("")}${line("M0 75A75 75 0 0 0 75 0", accent, 0.8)}</g>`;
      art +=
        line(
          "M153 91L200 54L247 91L200 113Z M172 91L200 68L228 91L200 102Z",
          accent,
          0.8,
        ) + star(200, 515, 4);
      break;
    }
    case "linen":
      art =
        rect(353, 0, 47, 560, accent + "28") +
        rect(365, 0, 35, 560, ink) +
        line("M40 45V511", accent, 0.9) +
        rule(108, 48, 325, ink) +
        rule(472, 48, 325) +
        `<circle cx="319" cy="61" r="19" fill="none" stroke="${accent}" stroke-width=".8"/>` +
        star(319, 61, 10) +
        line("M305 61H333M319 47V75", accent, 0.55);
      break;
    case "pearl":
      art =
        rect(0, 0, 400, 560, "#e9d8c4") +
        rect(20, 20, 360, 520, paper, 170) +
        arch(39, accent, 0.7) +
        arch(45, accent, 0.4) +
        Array.from(
          { length: 27 },
          (_, i) =>
            circle(20, 39 + i * 18, 2.5, "#fffaf1") +
            circle(380, 39 + i * 18, 2.5, "#fffaf1"),
        ).join("") +
        Array.from(
          { length: 19 },
          (_, i) =>
            circle(38 + i * 18, 21, 2.5, "#fffaf1") +
            circle(38 + i * 18, 539, 2.5, "#fffaf1"),
        ).join("") +
        line("M175 94Q200 62 225 94Q200 80 175 94M200 80V112", accent, 0.9);
      break;
    case "ribbon": {
      art =
        rect(0, 0, 400, 560, "#e4c2ba") +
        rect(17, 17, 366, 526, paper) +
        Array.from({ length: 30 }, (_, i) =>
          line(`M${5 + i * 14} 0V15 M${5 + i * 14} 545V560`, paper, 4),
        ).join("") +
        line("M25 25H375V535H25Z", accent, 0.6, 0.65);
      art += `<g transform="translate(200 65)"><path d="M-6 0C-44-54-93-59-94-19C-95 18-42 28-6 0ZM6 0C44-54 93-59 94-19C95 18 42 28 6 0Z" fill="url(#silk)" stroke="${accent}" stroke-width="1.2"/><path d="M-7 0Q-21 38-44 61L-20 56L-13 70L4 4M7 0Q23 39 44 61L20 56L13 70L-4 4" fill="url(#silk)" stroke="${accent}"/>${line("M-77-22Q-42-28-7 0M77-22Q42-28 7 0M-67 7Q-39 16-8 1M67 7Q39 16 8 1", accent, 0.7, 0.5)}<rect x="-9" y="-9" width="18" height="20" rx="5" fill="${accent}"/></g>`;
      art += rule(325, 166, 234) + rule(512, 170, 230);
      break;
    }
    case "porcelain":
      art =
        rect(0, 0, 400, 560, "#c6d6e0") +
        rect(28, 28, 344, 504, paper, 100) +
        line("M25 25H375V535H25Z M33 33H367V527H33Z", "#405e85", 1) +
        Array.from({ length: 10 }, (_, i) =>
          branch(
            i % 2 ? 383 : 17,
            70 + i * 49,
            i % 2 ? -15 : 15,
            0.36,
            "#48668b",
          ),
        ).join("") +
        Array.from(
          { length: 7 },
          (_, i) =>
            flower(31 + i * 56, 27, 0.47, "#7d96b1", 7) +
            flower(31 + i * 56, 532, 0.47, "#7d96b1", 7),
        ).join("") +
        `<path d="M151 99Q200 77 249 99Q200 119 151 99Z" fill="none" stroke="#405e85" stroke-width=".8"/>` +
        leaf(200, 108, 0, 0.47, "#48668b");
      break;
    case "moon-baby":
      art =
        rect(0, 0, 400, 560, "#24394e") +
        `<path d="M213 34A46 46 0 1 0 245 105A42 42 0 0 1 213 34Z" fill="url(#gold)"/>` +
        line(
          "M26 120Q200-8 374 120M20 129Q200 3 380 129M30 485Q200 560 370 485",
          accent,
          0.5,
          0.6,
        ) +
        Array.from({ length: 37 }, (_, i) =>
          star(
            24 + ((i * 67) % 352),
            i < 22 ? 19 + ((i * 31) % 91) : 468 + ((i * 17) % 70),
            i % 5 === 0 ? 4 : 1.6,
            accent,
          ),
        ).join("") +
        line(
          "M64 78L98 43L133 78L166 45M253 65L292 37L332 78",
          accent,
          0.6,
          0.35,
        );
      break;
    case "disco": {
      art =
        rect(0, 0, 400, 560, paper) +
        rect(0, 0, 400, 11, accent) +
        rect(0, 549, 400, 11, accent) +
        '<defs><clipPath id="mirror"><circle cx="200" cy="44" r="68"/></clipPath></defs><g clip-path="url(#mirror)">';
      for (let y = -27; y < 115; y += 15)
        for (let x = 128; x < 276; x += 15)
          art += rect(
            x,
            y,
            14,
            14,
            (x + y) % 4 === 0
              ? "#fdf6ed"
              : (x - y) % 3 === 0
                ? "#b595b1"
                : "#d9c9dd",
          );
      art +=
        "</g>" +
        `<circle cx="200" cy="44" r="68" fill="none" stroke="${accent}" stroke-width=".7"/>` +
        line(
          "M175-22Q140 44 175 110M225-22Q260 44 225 110M132 44H268",
          accent,
          0.6,
          0.7,
        ) +
        star(153, 31, 12, "#fffaf0") +
        star(233, 72, 8, "#fffaf0") +
        star(75, 84, 11) +
        star(324, 117, 8) +
        star(50, 461, 13) +
        star(346, 492, 8);
      break;
    }
    case "sage-press":
      art =
        rect(0, 0, 27, 560, ink) +
        rect(28, 0, 8, 560, accent + "35") +
        branch(365, 551, -12, 1.28, accent) +
        branch(356, 119, 164, 0.66, accent) +
        rule(129, 49, 316, ink) +
        rule(472, 49, 296, ink) +
        `<ellipse cx="306" cy="65" rx="19" ry="24" fill="none" stroke="${accent}" stroke-width=".8"/>` +
        leaf(306, 78, -8, 0.5, accent);
      break;
    case "cherry":
      art =
        rect(0, 0, 400, 560, "#8c4549") +
        rect(15, 15, 370, 530, paper, 10) +
        Array.from(
          { length: 21 },
          (_, i) =>
            circle(15, 23 + i * 26, 5, paper) +
            circle(385, 23 + i * 26, 5, paper),
        ).join("") +
        Array.from(
          { length: 15 },
          (_, i) =>
            circle(20 + i * 26, 15, 5, paper) +
            circle(20 + i * 26, 545, 5, paper),
        ).join("") +
        line("M176 76Q196 53 205 37Q217 61 231 78", "#58775a", 1.9) +
        leaf(204, 47, 74, 0.57, "#58775a") +
        circle(173, 87, 20, "#a74853") +
        circle(233, 89, 21, "#b7505a") +
        line("M162 79Q164 72 173 73M220 81Q223 74 230 75", "#f0b9b0", 2.5) +
        star(200, 516, 7, "#8c4549");
      break;
    case "cloud-nine":
      art =
        rect(0, 0, 400, 560, paper) +
        `<path d="M-20 93C2 58 29 83 39 61C62 20 95 55 109 28C137-3 177 8 191-9H0V93Z" fill="#fffaf1"/><path d="M400 62C379 37 358 69 343 41C321 6 292 31 275 0H400Z" fill="#fffaf1"/>` +
        ["#be8c77", "#d8bb85", "#a6b8aa", "#8babb8"]
          .map((c, i) =>
            line(
              `M${67 + i * 16} 660V620A${133 - i * 16} ${133 - i * 16} 0 0 1 ${333 - i * 16} 620V660`,
              c,
              11,
            ),
          )
          .join("") +
        `<path d="M0 536Q34 499 66 533Q90 512 111 542Q139 523 158 560H0ZM400 528Q365 492 335 532Q310 516 286 548Q269 528 248 560H400Z" fill="#fffaf1"/>` +
        star(278, 57, 6) +
        star(242, 93, 3) +
        rule(324, 174, 226);
      break;
    case "laurel":
      art =
        line("M27 27H373V533H27Z M34 34H366V526H34Z", accent, 0.6) +
        `<path d="M164 95Q131 65 168 36M236 95Q269 65 232 36" fill="none" stroke="${accent}" stroke-width="1.2"/>` +
        Array.from(
          { length: 5 },
          (_, i) =>
            leaf(161 - i * 1.5, 89 - i * 10, -65 - i * 12, 0.3, ink) +
            leaf(239 + i * 1.5, 89 - i * 10, 65 + i * 12, 0.3, ink),
        ).join("") +
        line("M188 50H212V78L200 87L188 78Z", accent, 1) +
        line("M180 511Q200 497 220 511M200 504V521", accent, 0.9);
      break;
    case "golden-hour":
      art =
        rect(0, 0, 400, 560, "#d5b29a") +
        rect(26, 26, 348, 508, paper, 172) +
        arch(41, accent, 1) +
        arch(48, accent, 0.5) +
        `<path d="M155 114A45 45 0 0 1 245 114" fill="none" stroke="${accent}" stroke-width="1"/>` +
        Array.from({ length: 15 }, (_, i) => {
          const a = (i / 14) * Math.PI;
          return line(
            `M${200 + Math.cos(a) * 51} ${113 - Math.sin(a) * 51}L${200 + Math.cos(a) * 65} ${113 - Math.sin(a) * 65}`,
            accent,
            0.7,
          );
        }).join("") +
        rule(327, 159, 241) +
        star(200, 508, 4);
      break;
    case "confetti":
      art =
        rect(0, 0, 400, 560, paper) +
        rect(0, 0, 13, 560, "#b87e6d") +
        `<path d="M270 0H400V118C350 122 295 77 270 0" fill="#d9bab1"/><path d="M306 0H400V68C358 77 321 38 306 0" fill="#a67468"/><path d="M285 458C333 421 394 440 400 478V560H260Z" fill="#d6bd87"/><path d="M313 488L400 467V560H346Z" fill="#aaac98"/>` +
        flower(336, 67, 0.61, "#ece0d0", 7) +
        rule(129, 48, 276) +
        rule(473, 48, 241) +
        star(368, 353, 7) +
        star(319, 424, 4);
      break;
    case "teddy":
      art =
        rect(0, 0, 400, 560, paper) +
        `<path d="M18 18H382V542H18Z" fill="none" stroke="${accent}" stroke-width=".7"/>` +
        '<g opacity=".45">' +
        Array.from(
          { length: 26 },
          (_, i) =>
            rect(i * 16, 0, 8, 17, "#b2bda0") +
            rect(i * 16, 543, 8, 17, "#b2bda0"),
        ).join("") +
        "</g>" +
        branch(40, 547, -4, 0.55, "#83936e") +
        branch(386, 539, 14, 0.48, "#83936e") +
        `<g transform="translate(305 477)">${circle(0, 0, 42, "#bd936e")}${circle(-22, -57, 14, "#bd936e")}${circle(22, -57, 14, "#bd936e")}${circle(0, -36, 32, "#cca581")}${circle(-21, -56, 8, "#d9bba0")}${circle(22, -56, 8, "#d9bba0")}${circle(0, -25, 15, "#e2c6a8")}${circle(-10, -41, 2.1, "#493c31")}${circle(11, -41, 2.1, "#493c31")}<path d="M-4-29Q0-33 5-29L0-24Z" fill="#493c31"/>${line("M0-24V-19M0-19Q-6-15-9-20M0-19Q6-15 9-20", "#6c5040", 1)}${circle(-37, 7, 17, "#bd936e")}${circle(37, 7, 17, "#bd936e")}${circle(-21, 36, 19, "#cca581")}${circle(24, 36, 19, "#cca581")}${line("M-4-1Q0 9-3 24", "#8d6c51", 0.8)}<path d="M-17-6L0 1L17-6V11L0 3L-17 11Z" fill="#7d9275"/></g>` +
        line("M150 92Q200 68 250 92", accent, 0.7) +
        flower(200, 86, 0.35, "#c7aa7d", 7);
      break;
    case "coastal":
      art =
        rect(0, 0, 400, 560, paper) +
        circle(200, 74, 25, "#d8b57d") +
        Array.from({ length: 12 }, (_, i) =>
          line(
            `M0 ${522 + i * 8}Q65 ${487 + i * 7} 133 ${521 + i * 7}T267 ${519 + i * 7}T400 ${522 + i * 8}`,
            "#668999",
            i % 3 ? 0.7 : 1.5,
            0.8,
          ),
        ).join("") +
        line("M24 30H376V530H24Z", accent, 0.55, 0.6) +
        line(
          "M113 95Q121 87 129 95Q137 87 145 95M278 57Q285 50 292 57Q299 50 306 57",
          accent,
          0.9,
        );
      break;
    case "fiesta":
      art =
        rect(0, 0, 400, 560, "#a56455") +
        rect(31, 31, 338, 498, paper, 150) +
        [
          [25, 34, 0.9, "#d3b476"],
          [376, 46, 1.08, "#dcae9f"],
          [9, 189, 0.9, "#bea8bf"],
          [388, 263, 0.85, "#d3b476"],
          [28, 420, 1, "#dcae9f"],
          [366, 499, 1.1, "#bea8bf"],
          [114, 548, 0.7, "#d3b476"],
          [280, 9, 0.75, "#b4bba0"],
        ]
          .map(([x, y, s, c]) =>
            flower(Number(x), Number(y), Number(s), String(c), 11),
          )
          .join("") +
        leaf(38, 120, 40, 0.7, "#69816b") +
        leaf(375, 385, -60, 0.7, "#69816b") +
        star(200, 503, 5);
      break;
    case "graduate":
      art =
        rect(0, 0, 400, 560, paper) +
        rect(0, 0, 15, 560, accent) +
        rule(129, 48, 351) +
        rule(473, 48, 351) +
        line(
          "M267 60L306 42L345 60L306 78Z M282 68V82Q306 96 330 82V68M345 60V94",
          accent,
          1.2,
        ) +
        line("M341 93V109M345 93V111M349 93V109", accent, 1.5) +
        line("M48 497H91M48 502H74", accent, 0.7);
      break;
    case "homecoming":
      art =
        rect(0, 0, 400, 560, paper) +
        Array.from(
          { length: 20 },
          (_, i) =>
            rect(i * 22, 0, 13, 12, accent + "80") +
            rect(i * 22, 548, 13, 12, accent + "80"),
        ).join("") +
        `<g transform="translate(0 500)"><path d="M0 88V21L40-5L80 21V88" fill="#b58271"/><path d="M100 88V7L145-23L190 7V88" fill="#d0b785"/><path d="M215 88V24L260-6L305 24V88" fill="#94a18a"/><path d="M327 88V9L367-17L407 9V88" fill="#8c9fab"/>${[20, 49, 122, 152, 238, 268, 345, 374].map((x) => rect(x, 35, 11, 16, paper, 5)).join("")}${rect(31, 58, 18, 30, paper, 8)}${rect(136, 56, 18, 32, paper, 8)}${rect(251, 57, 18, 31, paper, 8)}${rect(358, 56, 18, 32, paper, 8)}</g>` +
        line("M163 82L200 56L237 82V103H163Z", accent, 0.9) +
        circle(200, 82, 5, accent + "65");
      break;
    case "candle":
      art =
        rect(0, 0, 8, 560, ink) +
        rule(129, 48, 350, ink) +
        rule(473, 48, 274) +
        branch(365, 550, -7, 0.78, "#7e8c70") +
        `<g transform="translate(309 484)"><path d="M-13 0V-54H13V0Z" fill="#e3d2b7" stroke="${accent}" stroke-width=".7"/><path d="M-13-54Q-5-44 0-54Q8-44 13-54" fill="none" stroke="${accent}" stroke-width=".6"/><path d="M0-59C-17-75 2-88 1-96C17-78 15-65 0-59" fill="#d9b66e"/>${line("M0-53V-64", ink, 0.7)}${line("M-24 1H25M-20 5H21", accent, 0.8)}</g>` +
        leaf(315, 81, 15, 0.6, "#7e8c70");
      break;
    case "sunshine":
      art =
        rect(0, 0, 400, 560, paper) +
        circle(200, 65, 36, "#dfba77") +
        Array.from({ length: 24 }, (_, i) => {
          const a = (i * Math.PI) / 12;
          return line(
            `M${200 + Math.cos(a) * 44} ${65 + Math.sin(a) * 44}L${200 + Math.cos(a) * 59} ${65 + Math.sin(a) * 59}`,
            "#c6a064",
            1,
          );
        }).join("") +
        ["#af7764", "#d3b16f", "#9fae97", "#90a9b3"]
          .map((c, i) =>
            line(
              `M-20 ${551 + i * 16}Q100 ${502 + i * 16} 210 ${559 + i * 16}T420 ${551 + i * 16}`,
              c,
              9,
            ),
          )
          .join("") +
        star(55, 405, 7) +
        star(350, 452, 4);
      break;
    case "noir-bow":
      art =
        line("M25 32H375V528H25ZM31 38H369V522H31Z", ink, 0.65) +
        bow(57, 45, 0.46, ink) +
        bow(343, 45, 0.46, ink) +
        line("M57 53Q44 76 47 101M343 53Q356 76 353 101", ink, 0.7) +
        bow(57, 515, 0.3, ink) +
        bow(343, 515, 0.3, ink);
      break;
    case "just-married":
      art =
        line("M31 30H369V530H31Z", ink, 0.65, 0.6) +
        bow(54, 42, 0.42, ink) +
        bow(347, 42, 0.42, ink) +
        `<g transform="translate(252 450) scale(.88)">${line("M10 75V45Q11 31 27 28L33 5Q65-6 98 5L104 28Q121 31 123 45V75Z", ink, 1.2)}${line("M28 28L37 10Q64 1 93 10L100 28ZM18 48Q66 38 115 48M17 68H116M25 78V91H9V70M106 78V91H123V70M42 62H89V76H42Z", ink, 0.85)}${circle(27, 52, 6, paper)}${circle(107, 52, 6, paper)}${line("M30 4Q53 18 82 4M32-1Q68 11 98-1", accent, 0.8)}${Array.from({ length: 7 }, (_, i) => flower(34 + i * 10, 6 + (i % 2) * 3, 0.18, i % 2 ? paper : accent, 7)).join("")}${line("M51 82Q48 107 33 110M79 82Q83 110 101 108", ink, 0.7)}${rect(26, 107, 12, 3, accent)}${rect(97, 106, 12, 3, accent)}</g>`;
      break;
    case "folk-fiesta": {
      const folk = ["#d36a51", "#427f83", "#d2ac45", "#ad637d", "#749363"];
      art = line("M22 27H378V533H22Z", accent, 0.5, 0.7);
      for (let i = 0; i < 11; i++)
        art +=
          flower(26 + i * 35, 37 + (i % 2) * 10, 0.48, folk[i % 5], 8) +
          flower(26 + i * 35, 525 - (i % 2) * 8, 0.38, folk[(i + 2) % 5], 8);
      for (let i = 0; i < 8; i++)
        art +=
          leaf(20, 121 + i * 47, i % 2 ? 42 : -42, 0.38, folk[(i + 1) % 5]) +
          leaf(380, 121 + i * 47, i % 2 ? -42 : 42, 0.38, folk[(i + 3) % 5]);
      break;
    }
    case "leopard-noir":
    case "leopard-ivory": {
      art = rect(0, 0, 400, 560, "#b78c64");
      for (let y = 0; y < 580; y += 37)
        for (let x = 0; x < 420; x += 39) {
          const px = x + ((y / 37) % 2) * 18,
            py = y + Math.sin(x * 0.1) * 6;
          art += `<g transform="translate(${px} ${py}) rotate(${((x + y) % 63) - 31})"><path d="M-8-6Q-15-2-9 6M-5 9Q1 15 7 9M9 5Q14-1 7-7M3-9Q-2-13-6-9" fill="none" stroke="#33251f" stroke-width="4.5" stroke-linecap="round"/>${circle(0, 0, 5, "#9a6d4a")}</g>`;
        }
      art +=
        rect(43, 27, 314, 506, ink) +
        rect(48, 32, 304, 496, paper) +
        line("M55 39H345V521H55Z", accent, 0.7) +
        bow(200, 68, 0.95, key === "leopard-noir" ? "#151315" : "#262025") +
        line(
          "M175 74L155 123L177 113L187 128L201 76M213 75L238 123L216 114L208 128L198 76",
          accent,
          0.6,
          0.7,
        );
      break;
    }
    case "birthday-glam":
      art =
        line("M24 24H376V536H24Z", accent, 0.7) +
        `<ellipse cx="80" cy="67" rx="30" ry="39" fill="#dfb7bf" stroke="${accent}" stroke-width=".6"/><ellipse cx="325" cy="83" rx="26" ry="34" fill="#d8d3cf" stroke="#a39b97" stroke-width=".6"/>` +
        line("M79 107Q62 137 80 159M325 118Q347 150 324 170", accent, 0.7) +
        line("M65 46Q59 61 64 78M312 66Q307 76 311 88", paper, 3, 0.8) +
        star(42, 190, 7) +
        star(354, 376, 7) +
        star(62, 490, 5) +
        star(286, 43, 5) +
        line(
          "M33 35L42 29M367 35L358 29M34 526L43 532M367 526L358 532",
          accent,
          1,
        );
      break;
    case "galentines":
      art =
        line("M29 28H371V532H29Z", accent, 0.5, 0.5) +
        `<g transform="translate(310 63)">${line("M0-48V-10M-32-5Q-30 28 0 30Q30 28 32-5M-18-1Q-17 16 0 18Q17 16 18-1M-38-7H-26M-23-3H-12M12-3H23M26-7H38M-32-7V-22M-18-3V-17M18-3V-17M32-7V-22M0 30V43", accent, 1)}${[-32, -18, 18, 32].map((x) => `<path d="M${x - 2}-26q-2-8 2-11q5 5 2 11z" fill="${accent}"/>`).join("")}${circle(0, 46, 3, accent)}</g>` +
        `<g transform="translate(310 492)"><ellipse cx="0" cy="-7" rx="58" ry="15" fill="none" stroke="${accent}" stroke-width="1"/>${line("M-58-7L-67 37Q-52 30-39 39Q-25 31-10 39Q4 32 20 40Q34 33 50 38Q62 29 68 35L58-7M-40 0L-43 30M0 8V31M39 0L44 30M-15-15V-48H-12V-15M13-15V-55H16V-15", accent, 0.9)}${bow(0, 12, 0.33, accent)}</g>`;
      break;
    case "olive-monogram":
      art =
        line("M32 33H368V527H32Z M38 39H362V521H38Z", accent, 0.55) +
        `<ellipse cx="200" cy="80" rx="53" ry="51" fill="none" stroke="${accent}" stroke-width=".6"/>` +
        branch(147, 116, -28, 0.48, accent) +
        branch(253, 116, 28, 0.48, accent) +
        branch(37, 239, -9, 0.71, accent) +
        branch(363, 462, 170, 0.71, accent);
      break;
    case "embossed-cameo":
      art =
        rect(0, 0, 400, 560, "#ece7dd") +
        `<path d="M97 31Q81 53 57 61Q72 89 43 109V451Q72 474 57 499Q82 507 97 529H303Q321 507 343 499Q326 472 357 451V109Q326 88 343 61Q319 54 303 31Z" fill="${paper}" stroke="#ffffff" stroke-width="4"/>` +
        `<ellipse cx="200" cy="280" rx="135" ry="234" fill="none" stroke="#d9d0c0" stroke-width="1.2"/><ellipse cx="200" cy="280" rx="130" ry="229" fill="none" stroke="#ffffff" stroke-width="1.2"/>` +
        [0, 1, 2, 3]
          .map(
            (i) =>
              `<g transform="translate(${i % 2 ? 325 : 75} ${i < 2 ? 70 : 490}) rotate(${i < 2 ? 0 : 180})">${line("M0 0C-35-20-12-41 1-20C12-40 37-19 0 0M0 0Q-14 18-29 5M0 0Q14 18 29 5", "#c3b8a3", 1)}${line("M0-2C-31-22-11-37 0-18C12-36 33-20 0-2", "#ffffff", 1.8)}</g>`,
          )
          .join("");
      break;
    case "crimson-toast":
      art =
        rect(0, 0, 400, 47, "#93484c") +
        rect(0, 520, 400, 40, "#93484c") +
        line("M25 55H375M25 512H375", accent, 0.55) +
        `<g transform="translate(200 78)">${line("M-60-15H-8Q-7 14-34 16Q-61 13-60-15ZM-34 16V42M-50 43H-17M8-15H60Q61 14 34 16Q7 13 8-15ZM34 16V42M17 43H50", accent, 1)}${line("M-57-7H-11M11-7H57", accent, 0.5)}${star(0, 0, 5)}</g>` +
        `<g transform="translate(200 24)">${flower(0, 0, 0.22, paper, 8)}${leaf(-17, 3, -75, 0.24, paper)}${leaf(17, 3, 75, 0.24, paper)}</g>`;
      break;
    case "filigree":
      art =
        line("M24 24H376V536H24Z M31 31H369V529H31Z", accent, 0.7) +
        [
          [44, 44, 0],
          [356, 44, 90],
          [356, 516, 180],
          [44, 516, 270],
        ]
          .map(
            ([x, y, a]) =>
              `<g transform="translate(${x} ${y}) rotate(${a})">${line("M0 64C33 51-10 16 14 6C35-4 36 25 19 20C8 17 23-1 35 9C49 22 23 36 44 45M0 0C20 30 48-9 61 13C75 35 45 36 48 21C53 5 69 24 59 35M4 6L55 56M2 26Q-15 35 1 44Q20 40 7 28M27 4Q37-13 46 4Q43 19 31 9", accent, 0.85)}${leaf(23, 37, -46, 0.3, accent)}${leaf(41, 24, 136, 0.3, accent)}</g>`,
          )
          .join("");
      break;
    case "grand-bouquet":
      art =
        line("M27 27H373V533H27Z", accent, 0.6, 0.7) +
        [
          [33, 145, -12],
          [367, 445, 168],
          [47, 536, 10],
          [353, 27, 190],
        ]
          .map(([x, y, a]) => branch(x, y, a, 0.75, ink))
          .join("") +
        [
          [69, 44, 0.65],
          [118, 28, 0.48],
          [297, 32, 0.52],
          [350, 74, 0.7],
          [31, 351, 0.4],
          [369, 222, 0.43],
          [49, 488, 0.68],
          [109, 534, 0.49],
          [292, 530, 0.55],
          [354, 493, 0.7],
        ]
          .map(([x, y, scale]) => flower(x, y, scale, paper, 11))
          .join("");
      break;
    default:
      throw new Error("Unknown Studio illustration.");
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="800" height="1120"><defs><pattern id="grain" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M1 2h2M6 7h1M4 4v1" stroke="${ink}" stroke-opacity=".045" stroke-width=".6"/></pattern><linearGradient id="gold" x2="1" y2="1"><stop stop-color="#f5e3b5"/><stop offset=".48" stop-color="${accent}"/><stop offset="1" stop-color="#efd6a0"/></linearGradient><linearGradient id="silk" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${accent}" stop-opacity=".6"/><stop offset=".5" stop-color="#f0d5cb"/><stop offset="1" stop-color="${accent}" stop-opacity=".75"/></linearGradient></defs>${rect(0, 0, 400, 560, paper)}${art}${rect(0, 0, 400, 560, "url(#grain)")}</svg>`;
}
