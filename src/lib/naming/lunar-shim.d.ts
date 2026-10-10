declare module "lunar-javascript" {
  export interface EightCharLike {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getYearHideGan(): string[];
    getMonthHideGan(): string[];
    getDayHideGan(): string[];
    getTimeHideGan(): string[];
    getYearShiShenGan(): string;
    getMonthShiShenGan(): string;
    getDayShiShenGan(): string;
    getTimeShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonthShiShenZhi(): string[];
    getDayShiShenZhi(): string[];
    getTimeShiShenZhi(): string[];
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearDiShi(): string;
    getMonthDiShi(): string;
    getDayDiShi(): string;
    getTimeDiShi(): string;
    getYun(gender: number): YunLike;
  }
  export interface LiuNianLike {
    getYear(): number;
    getGanZhi(): string;
  }
  export interface DaYunLike {
    getGanZhi(): string;
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
    getIndex(): number;
    getLiuNian(n?: number): LiuNianLike[];
  }
  export interface YunLike {
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getDaYun(n?: number): DaYunLike[];
  }
  export interface LunarLike {
    toString(): string;
    getYearShengXiao(): string;
    getEightChar(): EightCharLike;
    getYearInGanZhi(): string;
  }
  export interface SolarLike {
    getLunar(): LunarLike;
  }
  export const Solar: {
    fromYmdHms(y: number, m: number, d: number, h: number, min: number, s: number): SolarLike;
    fromYmd(y: number, m: number, d: number): SolarLike;
  };
}
