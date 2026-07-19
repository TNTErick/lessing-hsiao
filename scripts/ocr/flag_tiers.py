CRUCIAL = {"NO_HEADWORD","EMPTY_BODY","MERGED_HEAD","HEADWORD_MISMATCH","SPLIT_GUESS","NO_LINE","SUPPL_MISMATCH"}
GENERAL = {"CYR_LOW_CONF","GAMMA_CHECK","VOWEL_I_CHECK","CROSS_PAGE","CROSS_COLUMN","SUPPL"}
def tier(flags):
    fl=set(flags or [])
    if fl & CRUCIAL: return "crucial"
    if fl & GENERAL: return "general"
    return "clean"
