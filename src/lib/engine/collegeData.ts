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
      const DATA_VERSION = 'all_rounds_v5_' + Date.now();
      const [cutoffsRes, collegesRes] = await Promise.all([
        fetch(`/data/cutoffs.json?v=${DATA_VERSION}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }),
        fetch(`/data/colleges.json?v=${DATA_VERSION}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }).catch(() => null)
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
