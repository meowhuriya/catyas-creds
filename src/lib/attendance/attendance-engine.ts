export interface AttendanceStats {
  classesHeld: number;
  classesAttended: number;
  classesAbsent: number;
  minimumPercentage: number;
  currentPercentage: number;
  isBelowLimit: boolean;
  classesCanMiss: number;
  classesToRecover: number;
  statusSentence: string;
}

/**
 * Calculates attendance rate, shortage warning status,
 * safe absence allowance ("you can still miss N classes"),
 * or recovery target if below minimum percentage.
 */
export function calculateAttendanceStats(
  classesHeld: number,
  classesAttended: number,
  minimumPercentage: number = 75
): AttendanceStats {
  const held = Math.max(0, Math.floor(classesHeld || 0));
  const attended = Math.max(0, Math.min(held, Math.floor(classesAttended || 0)));
  const absent = held - attended;
  const minPercent = Math.min(100, Math.max(1, minimumPercentage || 75));

  if (held === 0) {
    return {
      classesHeld: 0,
      classesAttended: 0,
      classesAbsent: 0,
      minimumPercentage: minPercent,
      currentPercentage: 100,
      isBelowLimit: false,
      classesCanMiss: 0,
      classesToRecover: 0,
      statusSentence: "you can still miss 0 classes",
    };
  }

  // Calculate percentage to 1 decimal place
  const currentPercentage = Math.round((attended / held) * 1000) / 10;
  const isBelowLimit = currentPercentage < minPercent;

  let classesCanMiss = 0;
  let classesToRecover = 0;
  let statusSentence = "";

  if (!isBelowLimit) {
    // Formula for safe absences without falling below minPercent:
    // (attended) / (held + N) >= minPercent / 100
    // 100 * attended >= minPercent * (held + N)
    // minPercent * N <= 100 * attended - minPercent * held
    // N <= (100 * attended - minPercent * held) / minPercent
    classesCanMiss = Math.floor((100 * attended - minPercent * held) / minPercent);
    classesCanMiss = Math.max(0, classesCanMiss);
    statusSentence = `you can still miss ${classesCanMiss} ${classesCanMiss === 1 ? "class" : "classes"}`;
  } else {
    // Formula for recovery:
    // (attended + M) / (held + M) >= minPercent / 100
    // (attended + M) * 100 >= minPercent * (held + M)
    // 100 * attended + 100 * M >= minPercent * held + minPercent * M
    // M * (100 - minPercent) >= minPercent * held - 100 * attended
    // M >= (minPercent * held - 100 * attended) / (100 - minPercent)
    if (minPercent >= 100) {
      classesToRecover = 999;
      statusSentence = "Cannot recover to 100% attendance";
    } else {
      classesToRecover = Math.ceil((minPercent * held - 100 * attended) / (100 - minPercent));
      statusSentence = `Must attend next ${classesToRecover} ${classesToRecover === 1 ? "class" : "classes"} to recover`;
    }
  }

  return {
    classesHeld: held,
    classesAttended: attended,
    classesAbsent: absent,
    minimumPercentage: minPercent,
    currentPercentage,
    isBelowLimit,
    classesCanMiss,
    classesToRecover,
    statusSentence,
  };
}
