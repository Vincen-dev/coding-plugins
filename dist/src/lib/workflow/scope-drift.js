function isSubset(values, approved) {
    if (!values || values.length === 0) {
        return true;
    }
    const approvedSet = new Set(approved ?? []);
    return values.every((value) => approvedSet.has(value));
}
export function classifyScopeRelation(active, request) {
    if (active.state === "complete" || active.state === "archived" || request.independentGoal) {
        return "new-change";
    }
    const hasScopeInput = Boolean(request.summary
        || request.plannedFiles?.length
        || request.specIds?.length
        || request.riskSignals?.length);
    if (!hasScopeInput) {
        return "uncertain";
    }
    if ((request.riskSignals?.length ?? 0) > 0) {
        return "expanded";
    }
    if (!isSubset(request.plannedFiles, active.scope.plannedFiles) || !isSubset(request.specIds, active.scope.specIds)) {
        return "expanded";
    }
    return "within-scope";
}
