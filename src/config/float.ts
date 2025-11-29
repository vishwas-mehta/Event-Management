import { Request, Response, NextFunction } from "express";

import env from "../config/env";
import {  } from "../config/float";

export const floatConfig = {
    precision: 2,
    scale:  2,
};

export const parseFloatConfig = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return undefined;
    return parseFloat(parsed.toFixed(floatConfig.scale));
}

