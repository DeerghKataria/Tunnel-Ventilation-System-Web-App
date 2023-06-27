let a0;
let len;
let dia;
let fricCoeffInt;
let leakage;
let siteHeight;
let temperature;
let pressureAtDuctEnd;
let ventilatorEfficiency;
let zetaLossFactor;
let lossFactor;
let airDensity;
let ldFactor;
let airVelocityAtFace
let FS;
let a51;
let pressureFactorInt;
let ventilatorVolumeSupply;
let statPressureLoss;
let dynPressureLoss;
let additLosses;
let totalPressureLoss;
let kw;

function calculateLossFactor() {
  let fricCoeffInt = parseFloat(
      document.getElementById("FrictionCoefficient").value
    ),
    FS = parseFloat(document.getElementById("Leakage").value) * 0.000001,
    X3 = 1.73,
    EO = 0.3333,
    TT,
    C,
    X,
    a32,
    lossFactor = 5,
    g0 = 10.0,
    g2 = 1.0,
    ldfactor,
    a0,
    len,
    dia;

  a0 = parseFloat(document.getElementById("AirVolume").value);
  len = parseFloat(document.getElementById("DuctLength").value);
  dia = parseFloat(document.getElementById("DuctDiameter").value);
  let pressureAtDuctEnd = parseFloat(
    document.getElementById("PressureatDuctEnd").value
  );

  ldfactor = len / dia;
  a32 = (a0 * 4) / Math.pow(dia, 2) / Math.PI;
  let a51 = (pressureAtDuctEnd * 2) / 1.2 / Math.pow(a32, 2);

  for (let i = 0; i < 24; i++) {
    let K = 8 * fricCoeffInt * Math.pow(FS, 2) * Math.pow(ldfactor, 3);
    let TM = 2 * Math.sqrt(a51) * Math.pow(FS / fricCoeffInt, EO);

    C = Math.pow(K, EO);
    C += Math.log((1 + TM + Math.pow(TM, 2)) / Math.pow(1 - TM, 2)) / 6;
    C -= Math.atan((2 * TM + 1) / X3) / X3;

    TT = (Math.pow(a51, 1.5) * 8 * FS) / fricCoeffInt;
    TT = Math.pow((TT - 1) / Math.pow(lossFactor, 3) + 1, EO);

    X =
      C -
      (Math.log(1 + TT + Math.pow(TT, 2)) - Math.log(Math.pow(1 - TT, 2))) / 6;
    X += Math.atan((2 * TT + 1) / X3) / X3;

    if (X < 0) {
      g0 = lossFactor;
    } else if (X > 0) {
      g2 = lossFactor;
    }

    lossFactor = (g0 + g2) / 2;
  }
  return lossFactor;
}

function calculateAirDensity(siteHeight, temperature) {
  return (353 * Math.pow(10, -(siteHeight * 0.000046))) / (273 + temperature);
}

function calculateLdFactor(ductLength, ductDiameter) {
  return ductLength / ductDiameter;
}

function calculateAirVelocityAtFace(airVolAtFront, dia) {
  return (airVolAtFront * 4) / (Math.pow(dia, 2) * Math.PI);
}

function calculateFS(leakage) {
  return leakage * 0.000001;
}

function calculateA51(pressureAtDuctEnd, airDensity, airVelocity) {
  return (pressureAtDuctEnd * 2) / airDensity / Math.pow(airVelocity, 2);
}

function calculatePressureFactorInt(lossFactor, fricCoeffInt, FS, a51) {
  return Math.pow(
    ((Math.pow(lossFactor, 3) - 1) * fricCoeffInt) / (8 * FS) +
      Math.pow(a51, 1.5),
    2 / 3
  );
}

function calculateVentilatorVolumeSupply(airVolAtFront, lossFactor) {
  return airVolAtFront * lossFactor;
}

function calculateStatPressureLoss(airDensity, pressureFactor, airVelocity) {
  return (airDensity * pressureFactor * Math.pow(airVelocity, 2)) / 2;
}

function calculateDynPressureLoss(
  airDensity,
  ventilatorVolumeSupply,
  ductDiameter
) {
  return (
    (airDensity / 2) *
    Math.pow(
      (ventilatorVolumeSupply * 4) / Math.pow(ductDiameter, 2) / Math.PI,
      2
    )
  );
}

function calculateAdditLosses(zetaLossFactor, dynPressureLoss) {
  return zetaLossFactor * dynPressureLoss;
}

function calculateTotalPressureLoss(
  statPressureLoss,
  dynPressureLoss,
  additLosses
) {
  return statPressureLoss + dynPressureLoss + additLosses;
}

function calculateKW(
  ventilatorVolumeSupply,
  totalPressureLoss,
  ventilatorEfficiency
) {
  return (
    (ventilatorVolumeSupply * totalPressureLoss) / 1020 / ventilatorEfficiency
  );
}

function performCalculations() {
 a0 = parseFloat(document.getElementById("AirVolume").value);
  len = parseFloat(document.getElementById("DuctLength").value);
 dia = parseFloat(document.getElementById("DuctDiameter").value);
fricCoeffInt = parseFloat(
    document.getElementById("FrictionCoefficient").value
  );
  leakage = parseFloat(document.getElementById("Leakage").value);
 siteHeight = parseFloat(document.getElementById("SiteHeightM").value);
  temperature = parseFloat(document.getElementById("Temperature").value);
  pressureAtDuctEnd = parseFloat(
    document.getElementById("PressureatDuctEnd").value
  );
  ventilatorEfficiency = parseFloat(
    document.getElementById("VentilatorEfficiency").value
  );
  zetaLossFactor = parseFloat(
    document.getElementById("ZetaLossFactor").value
  );

   lossFactor = calculateLossFactor();
  airDensity = calculateAirDensity(siteHeight, temperature);
   ldFactor = calculateLdFactor(len, dia);
  airVelocityAtFace = calculateAirVelocityAtFace(a0, dia);
  FS = calculateFS(leakage);
  a51 = calculateA51(pressureAtDuctEnd, airDensity, airVelocityAtFace);
   pressureFactorInt = calculatePressureFactorInt(
    lossFactor,
    fricCoeffInt,
    FS,
    a51
  );
   ventilatorVolumeSupply = calculateVentilatorVolumeSupply(a0, lossFactor);
  statPressureLoss = calculateStatPressureLoss(
    airDensity,
    pressureFactorInt,
    airVelocityAtFace
  );
   dynPressureLoss = calculateDynPressureLoss(
    airDensity,
    ventilatorVolumeSupply,
    dia
  );
   additLosses = calculateAdditLosses(zetaLossFactor, dynPressureLoss);
   totalPressureLoss = calculateTotalPressureLoss(
    statPressureLoss,
    dynPressureLoss,
    additLosses
  );
   kw = calculateKW(
    ventilatorVolumeSupply,
    totalPressureLoss,
    ventilatorEfficiency
  );

  document.getElementById("AirDensity").value = airDensity.toFixed(2);
  document.getElementById("LDFactor").value = ldFactor.toFixed(2);
  document.getElementById("PressureFactora1").value =
    pressureFactorInt.toFixed(2);
  document.getElementById("LossFactor").value = lossFactor.toFixed(2);
  document.getElementById("VentilatorVolumeSupply").value =
    ventilatorVolumeSupply.toFixed(2);
  document.getElementById("StatPressureLoss").value =
    statPressureLoss.toFixed(2);
  document.getElementById("DynPressureLoss").value = dynPressureLoss.toFixed(2);
  document.getElementById("AdditLosses").value = additLosses.toFixed(2);
  document.getElementById("TotalPressureLoss").value =
    totalPressureLoss.toFixed(2);
  document.getElementById("MinimumInstCapacity").value = kw.toFixed(2);

  console.log(document.querySelector("#Leakage").value);

  fetch('http://localhost:35735/save-calculations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(getCalculatedValues()),
});

}

document.addEventListener('DOMContentLoaded', function(){
  document.getElementById("Calculate").addEventListener("click", performCalculations);
});


function getCalculatedValues() {
  // Perform calculations and return the result as an object
  return {
    airDensity: airDensity,
    ldFactor: ldFactor,
    pressureFactor: pressureFactorInt,
    lossFactor: lossFactor,
    ventilatorVolumeSupply: ventilatorVolumeSupply,
    statPressureLoss: statPressureLoss,
    dynPressureLoss: dynPressureLoss,
    additLosses: additLosses,
    totalPressureLoss: totalPressureLoss,
    kw: kw,
  };
}

document.addEventListener('DOMContentLoaded', function(){
document.getElementById('Save').addEventListener('click', function() {
  fetch('http://localhost:35735/generate-pdf', {
    method: 'POST',
  });
});
});