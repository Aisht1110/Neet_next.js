import { CutoffRecord, CollegeIndexEntry, MasterCollege } from './types';
import { buildCollegeIndex } from './predictor';

let cachedRecords: CutoffRecord[] | null = null;
let cachedIndex: Map<string, CollegeIndexEntry> | null = null;
let cachedMasterColleges: MasterCollege[] | null = null;
let fetchPromise: Promise<{
  records: CutoffRecord[];
  index: Map<string, CollegeIndexEntry>;
  masterColleges: MasterCollege[];
}> | null = null;

export async function getCollegeData(): Promise<{
  records: CutoffRecord[];
  index: Map<string, CollegeIndexEntry>;
  masterColleges: MasterCollege[];
}> {
  if (cachedRecords && cachedIndex && cachedMasterColleges) {
    return { records: cachedRecords, index: cachedIndex, masterColleges: cachedMasterColleges };
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      // Version is fixed at build time (see next.config / .env) so the browser
      // and CDN can actually cache these large JSON files. Bump
      // NEXT_PUBLIC_DATA_VERSION when the datasets change.
      const DATA_VERSION = process.env.NEXT_PUBLIC_DATA_VERSION || 'v5';
      const [cutoffsRes, collegesRes] = await Promise.all([
        fetch(`/data/cutoffs.json?v=${DATA_VERSION}`),
        fetch(`/data/colleges.json?v=${DATA_VERSION}`).catch(() => null)
      ]);

      if (!cutoffsRes.ok) {
        throw new Error(`Failed to load cutoffs.json (status ${cutoffsRes.status})`);
      }

      const data: CutoffRecord[] = await cutoffsRes.json();
      let masterColleges: MasterCollege[] = [];

      if (collegesRes && collegesRes.ok) {
        try {
          const cJson = await collegesRes.json();
          masterColleges = cJson.colleges || [];
        } catch {
          // fallback if colleges.json parsing fails
        }
      }

      cachedRecords = data;
      cachedMasterColleges = masterColleges;
      cachedIndex = buildCollegeIndex(data, masterColleges);

      return { records: cachedRecords, index: cachedIndex, masterColleges: cachedMasterColleges };
    } catch (err) {
      console.error('Error loading college & cutoff data:', err);
      throw err;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}
