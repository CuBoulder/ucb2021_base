window.onload = function generateJSONLD() {
  var dynamicJSONLD = '\n{\n "@context": "https:/schema.org",\n "@type": "HowTo",\n';

  const title = document.getElementById("titleValue");
  dynamicJSONLD +=  '"name": "' + title.innerText + '",\n';

  const initImage = document.querySelector('.initialImage img');
  dynamicJSONLD += ' "image": {\n"@type": "ImageObject",\n "url": "'+ initImage.src + '",\n "height": "406",\n "width": "305"\n},\n';

  const estimatedCost = document.getElementById("estimatedCostValue").innerText;
  dynamicJSONLD += '"estimatedCost": {\n"@type": "MonetaryAmount",\n"currency": "USD",\n"value": "' + estimatedCost + '"\n},\n'

  const materialList = document.getElementsByClassName("materialValue");
  dynamicJSONLD += ' "supply": [ ';
  for( material of materialList) {
    dynamicJSONLD += ' \n{\n "@type": "HowToSupply",\n "name": "' + material.innerText + '"\n},';
  }
  dynamicJSONLD = dynamicJSONLD.slice(0,-1);
  dynamicJSONLD += '\n],\n';

  
  const toolList = document.getElementsByClassName("toolValue");
  dynamicJSONLD += ' "tool": [ ';
  for( tool of toolList) {
    dynamicJSONLD += ' \n{\n "@type": "HowToTool", "name": "' + tool.innerText + '"\n},';
  }
  dynamicJSONLD = dynamicJSONLD.slice(0,-1);
  dynamicJSONLD += '\n],\n';

  const stepList = document.getElementsByClassName("howToStep");
  dynamicJSONLD += '"step":[\n';
  for( step of stepList) {
    dynamicJSONLD += '{\n "@type": "HowToStep", \n';
    stepTitle = step.querySelector('.stepTitle');
    dynamicJSONLD += ' "name": "' + stepTitle.innerText + '", \n';
    stepText = step.querySelector('.stepText');
    dynamicJSONLD += ' "text": "' + stepText.innerText + '", \n';
    stepImg = step.querySelector('.eachStepImage img');
    dynamicJSONLD += ' "image": "' + stepImg.src + '" \n';
    dynamicJSONLD += '},'
  }

  dynamicJSONLD = dynamicJSONLD.slice(0,-1);
  dynamicJSONLD += '\n] }';

  const script = document.createElement("script");
  script.setAttribute("type", "application/ld+json");
  script.textContent = dynamicJSONLD;
  document.head.appendChild(script);
  console.log(dynamicJSONLD);
}
