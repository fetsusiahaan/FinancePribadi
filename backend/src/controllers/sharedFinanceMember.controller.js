import * as sharedFinanceMemberService from "../services/sharedFinanceMember.service.js";
import { getClientIp } from "../utils/getClientIp.js";

export async function listMembers(req, res, next) {
  try {
    const data = await sharedFinanceMemberService.list(req.membership, {
      includeInactive: req.query.include_inactive === "true",
    });
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    await sharedFinanceMemberService.remove(req.membership, req.params.memberId, getClientIp(req));
    res.json({ status: "success", message: "Member removed" });
  } catch (err) {
    next(err);
  }
}

export async function leaveSharedFinance(req, res, next) {
  try {
    await sharedFinanceMemberService.leave(req.membership, getClientIp(req));
    res.json({ status: "success", message: "Left shared finance" });
  } catch (err) {
    next(err);
  }
}
