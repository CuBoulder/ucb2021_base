window.onload = function generateJSONLD() {
  var dynamicJSONLD = '\n{\n \t"@context": "https://schema.org",\n\t "@type": "HowTo",\n';

  const title = document.getElementById("titleValue");
  dynamicJSONLD +=  '\t"name": "' + title.innerText + '",\n';

  const initImage = document.querySelector('.initialImage img');
  dynamicJSONLD += ' \t"image": {\n\t\t"@type": "ImageObject",\n\t\t "url": "'+ initImage.src + '",\n\t\t "height": "406",\n\t\t "width": "305"\n\t},\n';

  const estimatedCost = document.getElementById("estimatedCostValue").innerText;
  dynamicJSONLD += '\t"estimatedCost": {\n\t\t"@type": "MonetaryAmount",\n\t\t"currency": "USD",\n\t\t"value": "' + estimatedCost + '"\n\t},\n'

  const materialList = document.getElementsByClassName("materialValue");
  dynamicJSONLD += '\t"supply": [ ';
  for( material of materialList) {
    dynamicJSONLD += ' \n\t\t{\n\t\t\t"@type": "HowToSupply",\n\t\t\t"name": "' + material.innerText + '"\n\t\t},';
  }
  dynamicJSONLD = dynamicJSONLD.slice(0,-1);
  dynamicJSONLD += '\n\t],\n';

  
  const toolList = document.getElementsByClassName("toolValue");
  dynamicJSONLD += '\t"tool": [ ';
  for( tool of toolList) {
    dynamicJSONLD += ' \n\t\t{\n\t\t\t"@type": "HowToTool", \t\t\t"name": "' + tool.innerText + '"\n\t\t},';
  }
  dynamicJSONLD = dynamicJSONLD.slice(0,-1);
  dynamicJSONLD += '\n\t],\n';

  const stepList = document.getElementsByClassName("howToStep");
  dynamicJSONLD += '\t"step":[\n';
  for( step of stepList) {
    dynamicJSONLD += '\t\t{\n \t\t\t"@type": "HowToStep", \n';
    stepTitle = step.querySelector('.stepTitle');
    dynamicJSONLD += '\t\t\t"name": "' + stepTitle.innerText + '", \n';
    stepText = step.querySelector('.stepText');
    dynamicJSONLD += '\t\t\t"text": "' + stepText.innerText + '", \n';
    stepImg = step.querySelector('.eachStepImage img');
    dynamicJSONLD += '\t\t\t"image": "' + stepImg.src + '" \n';
    dynamicJSONLD += '\t\t},'
  }

  dynamicJSONLD = dynamicJSONLD.slice(0,-1);
  dynamicJSONLD += '\n\t] \n}\n';

  const script = document.createElement("script");
  script.setAttribute("type", "application/ld+json");
  script.textContent = dynamicJSONLD;
  document.head.appendChild(script);
  console.log(dynamicJSONLD);
}
