/**
 * Nigerian Tertiary Institution (NUC 5-Point Grading System)
 */

export function calculateGrade(totalScore) {
  const score = Math.round(Number(totalScore) || 0)

  if (score >= 70 && score <= 100) {
    return { grade: 'A', gradePoint: 5.0, description: 'Excellent' }
  } else if (score >= 60 && score <= 69) {
    return { grade: 'B', gradePoint: 4.0, description: 'Very Good' }
  } else if (score >= 50 && score <= 59) {
    return { grade: 'C', gradePoint: 3.0, description: 'Good' }
  } else if (score >= 45 && score <= 49) {
    return { grade: 'D', gradePoint: 2.0, description: 'Fair' }
  } else if (score >= 40 && score <= 44) {
    return { grade: 'E', gradePoint: 1.0, description: 'Pass' }
  } else {
    return { grade: 'F', gradePoint: 0.0, description: 'Fail' }
  }
}

export function getDegreeClassification(cgpa) {
  const val = Number(cgpa) || 0.0
  if (val >= 4.50) {
    return 'First Class Honours'
  } else if (val >= 3.50) {
    return 'Second Class Honours (Upper Division)'
  } else if (val >= 2.40) {
    return 'Second Class Honours (Lower Division)'
  } else if (val >= 1.50) {
    return 'Third Class Honours'
  } else if (val >= 1.00) {
    return 'Pass'
  } else {
    return 'Fail'
  }
}

export function calculateCGPA(resultsWithUnits) {
  let totalUnits = 0
  let totalQualityPoints = 0

  resultsWithUnits.forEach((item) => {
    const units = Number(item.credit_units) || 0
    const point = Number(item.grade_point) || 0
    const qp = units * point

    totalUnits += units
    totalQualityPoints += qp
  })

  const cgpa = totalUnits > 0 ? (totalQualityPoints / totalUnits).toFixed(2) : '0.00'
  const classification = getDegreeClassification(Number(cgpa))

  return {
    totalCreditUnits: totalUnits,
    totalQualityPoints: Number(totalQualityPoints.toFixed(2)),
    cgpa: Number(cgpa),
    classification,
  }
}

export function normalizeRegNumber(regNo) {
  if (!regNo) return ''
  return String(regNo)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '') // remove inner spaces
    .replace(/[–—]/g, '-') // normalize dashes
}
