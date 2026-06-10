import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysesRouter from "./analyses";
import statsRouter from "./stats";
import explainRouter from "./explain";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysesRouter);
router.use(statsRouter);
router.use(explainRouter);

export default router;
