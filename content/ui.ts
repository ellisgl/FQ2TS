// The game's fixed screens: title, help, credits, world map legend, status
// bar and inventory. Text uses the markup described in engine/text.js.

import { COLORS } from "../engine/screen.ts";
import { at } from "../engine/assert.ts";
import type { Config, Content } from "../engine/game.ts";
import type { Player } from "../engine/player.ts";
import type { Flags, G } from "./start.ts";

export const title: Content<Flags>["title"] = {
  art: ({ version, revision }) => [
    String.raw`{y 1}{x 1}{on gray}{sp 35}{white}Main Menu{sp 36}`,
    String.raw`{y 2}{on gray} {on blue}{sp 78}{on gray} `,
    String.raw`{y 3}{on gray} {on blue}{sp 31}{yellow}2222222222222222{sp 31}{on gray} `,
    String.raw`{y 4}{on gray} {on blue}{sp 31}{yellow}              22{sp 31}{on gray} `,
    String.raw`{y 5}{on gray} {on blue}{lightcyan}    FFFFF  IIIII  N   N    A    L        QQQQQ{yellow}2{lightcyan} U   U  EEEEE  SSSSS  TTTTT    {on gray} `,
    String.raw`{y 6}{on gray} {on blue}{lightcyan}    F        I    NN  N   A A   L        Q   Q{yellow}2{lightcyan} U   U  E      S        T      {on gray} `,
    String.raw`{y 7}{on gray} {on blue}{lightcyan}    FFFFF    I    N N N  A   A {yellow}2{lightcyan}L{yellow}22222222{lightcyan}Q{yellow}222{lightcyan}Q{yellow}2{lightcyan} U   U  EEEE   SSSSS    T      {on gray} `,
    String.raw`{y 8}{on gray} {on blue}{lightcyan}    F        I    N  NN  AAAAA {yellow}2{lightcyan}L        Q Q Q  U   U  E          S    T      {on gray} `,
    String.raw`{y 9}{on gray} {on blue}{lightcyan}    F      IIIII  N   N  A   A {yellow}2{lightcyan}LLLLL    QQQQQ  UUUUU  EEEEE  SSSSS    T      {on gray} `,
    String.raw`{y 10}{on gray} {on blue}{sp 31}{yellow}22{lightcyan}           Q{sp 33}{on gray} `,
    String.raw`{y 11}{on gray} {on blue}{sp 31}{yellow}2222222222222222{sp 31}{on gray} `,
    String.raw`{y 12}{on gray} {on blue}{sp 78}{on gray} `,
    String.raw`{y 13}{on gray}{sp 80}`,
    `{y 13}{on gray}{white}{center}${version} ${revision}`,
    String.raw`{y 15}{x 13}//{x 24}//{x 31}{on gray}{sp 20}{on black}{x 57}\\{x 68}\\`,
    String.raw`{y 16}{x 10}////{x 21}////{x 31}{on gray} {on blue}{sp 18}{on gray} {on black}{x 58}\\\\{x 69}\\\\`,
    String.raw`{y 17}{x 7}/////{x 18}/////{x 31}{on gray} {on blue}{sp 18}{on gray} {on black}{x 60}\\\\\{x 71}\\\\\{sp 0}`,
    String.raw`{y 18}{x 6}////{x 17}////{x 31}{on gray} {on blue}{sp 18}{on gray} {on black}{x 61}\\\\{x 72}\\\\`,
    String.raw`{y 19}{x 4}////{x 15}////{x 31}{on gray} {on blue}{sp 18}{on gray} {on black}{x 62}\\\\{x 73}\\\\`,
    String.raw`{y 20}{x 4}\\\\{x 15}\\\\{x 31}{on gray} {on blue}{sp 18}{on gray} {on black}{x 62}////{x 73}////`,
    String.raw`{y 21}{x 6}\\\\{x 17}\\\\{x 31}{on gray} {on blue}{sp 18}{on gray} {on black}{x 61}////{x 72}////`,
    String.raw`{y 22}{x 7}\\\\\{x 18}\\\\\{x 31}{on gray} {on blue}{sp 18}{on gray} {on black}{x 60}/////{x 71}/////`,
    String.raw`{y 23}{x 10}\\\\{x 21}\\\\{x 31}{on gray} {on blue}{sp 18}{on gray} {on black}{x 58}////{x 69}////`,
    String.raw`{y 24}{x 13}\\{x 24}\\{x 31}{on gray}{sp 20}{on black}{x 57}//{x 68}//`,
  ],
  // [label, x, y]; colours are [foreground, background].
  menu: {
    options: [
      ["Enter the Realm", 33, 17],
      ["Save Game", 36, 18],
      ["Load Game", 36, 19],
      ["Help", 38, 20],
      ["Resume Game", 35, 21],
      ["Leave this place", 33, 22],
    ],
    selectedColor: [11, 1],
    color: [9, 1],
  },
};

export const help = ({ title, version, company }: Config): string[] => [
  `{y 1}{yellow}{center}Welcome to ${title} ${version} by ${company}.`,
  "{y 3}{x 37}{yellow}KEYS:",
  "{y 4}{x 31}{lightgreen}← = Moves you Left",
  "{y 5}{x 31}{lightgreen}→ = Moves you Right",
  "{y 6}{x 31}{lightgreen}↓ = Moves you Down",
  "{y 7}{x 31}{lightgreen}↑ = Moves you Up",
  "{y 8}{lightgreen}{center}I = Inventory -- M = Map",
  "{y 9}{lightgreen}{center}ESC = Quit to Menu",
  "{y 12}{x 3}{lightcyan}So, here we are.  Not much to report on this revision because I haven't done",
  "{y 13}{lightcyan}much with it.  I am attempting to make as many screens as I can, and impliment",
  "{y 14}{lightcyan}as much gameplay into them as possible.  You know, I'm not that creative of a",
  "{y 15}{lightcyan}guy!  I don't know what I am going to do!  Anyway, today is 4/17/01, and this",
  "{y 16}{lightcyan}is Rev 094B02, So I guess I will keep working on it.  The only reason that this",
  "{y 17}{lightcyan}game never made 1.0 is because of that darned gameplay... Hey, I'll get it",
  "{y 18}{lightcyan}eventually.  I've been working on it for two years and eight months now, so",
  "{y 19}{lightcyan}three more years won't be any different.  {yellow}:{darkgray}-{lightgreen})",
  "{y 21}{white}Good Luck Adventurer.",
  "{y 23}{yellow}Press any key...",
];

// `frame` is a colour number (1-7) for the shaded border.
export function credits({ title, company, version, revision }: Config, frame: number): string[] {
  const c = at(COLORS, frame);
  const box = (y: number, inner: string): string => `{y ${y}}{${c}}░░░░▒▒{darkgray}{on gray}${inner}{on black}{${c}}▒▒░░░░`;
  const text = (y: number, s: string): string => box(y, `║{black}${s.padEnd(66)}{darkgray}║`);
  return [
    `{y 1}{${c}}░░░░▒▒▒▓▓▓▓{on ${c}}{sp 58}{on black}▓▓▓▓▒▒▒░░░░`,
    box(2, `╔${"═".repeat(66)}╗`),
    text(3, ""),
    box(4, `╟${"─".repeat(28)}┤{yellow}Credits{darkgray}├${"─".repeat(29)}╢`),
    text(5, "        This game engine was originally brought to you by"),
    text(6, "          Author....... at Akori Software, a division of"),
    text(7, "                      Hollow-Head Software."),
    text(8, ""),
    text(9, `    The game you just played used the ${title} (tm) engine`),
    text(10, "                               to run."),
    text(11, ""),
    text(12, ""),
    box(13, `╚${"═".repeat(66)}╝`),
    `{y 14}{${c}}░░░░▒▒▒▓▓▓▓{on ${c}}{sp 58}{on black}▓▓▓▓▒▒▒░░░░`,
    `{y 3}{black}{on gray}{center}Thank you for playing ${title}`,
    `{y 12}{black}{on gray}{center}This gameplay brought to you by ${company}...`,
    `{y 14}{white}{on ${c}}{center}${version} ${revision}`,
  ];
}

export const worldMapLegend: readonly string[] = [
  "{x 30}{y 3}{white}{on blue}Welcome to {yellow}F{red}inal {yellow}Q{red}uest {yellow}2{white}.",
  "{x 28}{y 5}{white}{on blue}A {on gray} {on blue} represents a large town,",
  "{x 28}{y 6}{white}{on blue}a {gray}{on green}■{on blue}{white} represents a small town,",
  "{x 28}{y 7}{white}{on blue}and a {on green} {on blue} represents land.",
];

export const statusLine = (p: Player<Flags>, { title, companyShort }: Config): string =>
  `${title} -- By ${companyShort} -- HP (${p.hp}/${p.maxHp}) -- Gold: ${p.gold}!`;

export function inventory(g: G): void {
  const rows = [
    `{white}Experience: ${g.exp}`,
    `{white}Hitpoints: {lightred}${g.hp}`,
    `{white}Gold: {yellow}$${g.gold}`,
    g.flags.hasBankAccount && `{white}Gold in Bank: {yellow}$${g.flags.bankGold}`,
    `{white}Strength: {lightcyan}${g.strength}`,
    `{white}Defense: {lightcyan}${g.defense}`,
    `{white}Weapon: {lightmagenta}${g.weapon.name}`,
    `{white}Armour: {lightmagenta}${g.armour.name}`,
    g.flags.berries > 0 && `{white}Wildberries: {red}${g.flags.berries}`,
  ].filter((row) => row !== false);

  g.overlay("{y 3}{x 7}{white}┌───────────────────┐");
  g.overlay("{y 4}{x 3}{on blue}    {on black}{white}│{x 13}Inventory{x 27}│{on blue}    ");
  g.overlay("{y 5}{x 7}{white}└───────────────────┘");

  const top = 7;
  const bottom = top + rows.length + 3;
  g.overlay(`{y ${top}}{x 14}{white}{on blue}┌${"─".repeat(53)}┐`);
  for (let y = top + 1; y < bottom; y++) g.overlay(`{y ${y}}{x 14}{white}{on blue}│${" ".repeat(53)}│`);
  g.overlay(`{y ${bottom}}{x 14}{white}{on blue}└${"─".repeat(53)}┘`);
  rows.forEach((row, i) => g.overlay(`{y ${top + 2 + i}}{x 17}${row}`));

  const key = bottom + 2;
  g.overlay(`{y ${key}}{x 54}{white}┌───────────────────┐`);
  g.overlay(`{y ${key + 1}}{x 50}{on blue}    {on black}{white}│   Press a Key..   │{on blue}    `);
  g.overlay(`{y ${key + 2}}{x 54}{white}└───────────────────┘`);
}
