import * as icones from "react-icons/hi2";
export type IconNames = keyof typeof icones;

export type ItemMenu = {
  name: string;
  path: string;
  order: number;
  icon: IconNames;
  id: string;
}