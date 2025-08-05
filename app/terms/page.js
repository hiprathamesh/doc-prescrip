'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import DocPill from '../../components/icons/DocPill';
import CustomDropdown from '../../components/CustomDropdown';

export default function TermsOfService() {
  usePageTitle('Terms of Service');
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'marathi', label: 'मराठी' },
    { value: 'hindi', label: 'हिन्दी' },
    { value: 'spanish', label: 'Español' },
    { value: 'chinese', label: '中文' }
  ];

  const getContent = () => {
    switch (selectedLanguage) {
      case 'marathi':
        return {
          title: 'सेवा अटी',
          effectiveDate: 'प्रभावी दिनांक:',
          sections: [
            {
              title: '1. अटींचा स्वीकार',
              content: 'डॉक प्रेस्क्रिप ("सेवा") वापरून, आपण या सेवा अटींना ("अटी") बांधील राहण्यास सहमत आहात. आपण या अटींशी सहमत नसल्यास, आपण सेवा वापरू शकत नाही. या अटी सेवेच्या सर्व वापरकर्त्यांना लागू होतात, ज्यामध्ये आरोग्य व्यावसायिक, वैद्यकीय व्यावसायिक आणि त्यांचे अधिकृत कर्मचारी यांचा समावेश आहे.'
            },
            {
              title: '2. सेवेचे वर्णन',
              content: 'डॉक प्रेस्क्रिप ही एक सर्वसमावेशक वैद्यकीय प्रॅक्टिस व्यवस्थापन प्रणाली आहे जी आरोग्य व्यावसायिकांना रुग्ण रेकॉर्ड व्यवस्थापित करण्यात, प्रिस्क्रिप्शन तयार करण्यात, वैद्यकीय प्रमाणपत्रे तयार करण्यात, बिलिंगचा मागोवा घेण्यात आणि त्यांच्या प्रॅक्टिस ऑपरेशन्स सुव्यवस्थित करण्यात मदत करण्यासाठी डिझाइन केली आहे. सेवेमध्ये खालील गोष्टींचा समावेश आहे परंतु त्यापुरते मर्यादित नाही: रुग्ण रेकॉर्ड व्यवस्थापन आणि वैद्यकीय इतिहास ट्रॅकिंग, डिजिटल प्रिस्क्रिप्शन निर्मिती आणि व्यवस्थापन, वैद्यकीय प्रमाणपत्र निर्मिती, बिलिंग आणि पेमेंट ट्रॅकिंग, अपॉइंटमेंट शेड्यूलिंग आणि फॉलो-अप व्यवस्थापन, प्रिस्क्रिप्शन टेम्प्लेट्स आणि वैद्यकीय डेटा संस्था, PDF निर्मिती आणि सामायिकरण क्षमता.'
            },
            {
              title: '3. वापरकर्ता पात्रता आणि नोंदणी',
              content: 'डॉक प्रेस्क्रिप वापरण्यासाठी, आपण असणे आवश्यक आहे: परवानाधारक वैद्यकीय व्यावसायिक किंवा आरोग्य व्यावसायिक, परवानाधारक वैद्यकीय व्यावसायिकाच्या देखरेखीखाली काम करणारे अधिकृत कर्मचारी, कमीत कमी 18 वर्षे वयाचे, बंधनकारक करार करण्यास कायदेशीररित्या सक्षम. आपण नोंदणी दरम्यान अचूक, वर्तमान आणि संपूर्ण माहिती प्रदान करण्यास आणि अशी माहिती अचूक, वर्तमान आणि संपूर्ण ठेवण्यासाठी अद्यतनित करण्यास सहमती देता.'
            },
            {
              title: '4. व्यावसायिक जबाबदारी',
              content: 'या सेवेचा वापर करणारे आरोग्य व्यावसायिक म्हणून, आपण कबूल करता आणि सहमत आहात की: सेवेद्वारे घेतलेल्या सर्व वैद्यकीय निर्णयांची आणि प्रिस्क्रिप्शन्सची एकमेव जबाबदारी आपल्यावर आहे, आपण सर्व लागू वैद्यकीय नियम आणि व्यावसायिक मानकांचे पालन करणे आवश्यक आहे, उपचार निर्णय घेण्यापूर्वी आपण सर्व रुग्ण माहिती आणि वैद्यकीय डेटाची पडताळणी कराल, आपण योग्य व्यावसायिक परवाना आणि प्रमाणपत्रे राखाल, आपण रुग्ण गोपनीयता आणि वैद्यकीय रेकॉर्ड ठेवण्याबाबत सर्व लागू कायद्यांचे पालन कराल.'
            },
            {
              title: '5. डेटा सुरक्षा आणि गोपनीयता',
              content: 'आम्ही डेटा सुरक्षा गांभीर्याने घेतो आणि आपले डेटा आणि रुग्ण माहिती संरक्षित करण्यासाठी योग्य तांत्रिक आणि संघटनात्मक उपाय लागू करतो. तथापि, आपण कबूल करता की: आपल्या लॉगिन क्रेडेन्शियल्सची गोपनीयता राखण्याची जबाबदारी आपल्यावर आहे, सेवेचा वापर संपल्यानंतर आपण आपल्या खात्यातून लॉग आउट करणे आवश्यक आहे, आपण अनधिकृत व्यक्तींसह आपल्या खात्याचा प्रवेश सामायिक करू नये, कोणत्याही संशयित सुरक्षा उल्लंघनाची तातडीने तक्रार करणे आवश्यक आहे.'
            },
            {
              title: '6. स्वीकार्य वापर',
              content: 'आपण सेवा केवळ कायदेशीर हेतूंसाठी आणि या अटींनुसार वापरण्यास सहमत आहात. आपण सहमत आहात की: कोणत्याही बेकायदेशीर किंवा अनधिकृत हेतूसाठी सेवेचा वापर करणार नाही, कोणत्याही लागू कायदे किंवा नियमांचे उल्लंघन करणार नाही, सेवा किंवा सेवेशी जोडलेल्या सर्व्हरमध्ये व्यत्यय आणणार नाही किंवा व्यत्यय आणणार नाही, सेवेच्या कोणत्याही भागामध्ये अनधिकृत प्रवेश मिळवण्याचा प्रयत्न करणार नाही, कोणताही हानिकारक किंवा दुर्भावनापूर्ण कोड प्रसारित करण्यासाठी सेवेचा वापर करणार नाही, अनधिकृत तृतीय पक्षांसह रुग्ण डेटा सामायिक करणार नाही.'
            },
            {
              title: '7. बौद्धिक संपदा',
              content: 'सेवा आणि तिची मूळ सामग्री, वैशिष्ट्ये आणि कार्यक्षमता डॉक प्रेस्क्रिपच्या मालकीची आहे आणि आंतरराष्ट्रीय कॉपीराइट, ट्रेडमार्क, पेटंट, व्यापार गुप्त आणि इतर बौद्धिक संपदा कायद्यांद्वारे संरक्षित आहे. आपण सेवेत इनपुट केलेल्या वैद्यकीय डेटा आणि रुग्ण माहितीची मालकी आपल्याकडे राहते.'
            },
            {
              title: '8. दायित्वाची मर्यादा',
              content: 'लागू कायद्याने परवानगी दिलेली कमाल मर्यादेपर्यंत, डॉक प्रेस्क्रिप कोणत्याही अप्रत्यक्ष, आकस्मिक, विशेष, परिणामी किंवा दंडात्मक नुकसानीसाठी किंवा प्रत्यक्ष किंवा अप्रत्यक्षपणे झालेल्या नफ्याची किंवा महसुलाची हानी किंवा डेटा, वापर, सद्भावना किंवा इतर अमूर्त नुकसानीसाठी जबाबदार राहणार नाही. आपण कबूल करता की सेवा ही वैद्यकीय प्रॅक्टिस व्यवस्थापनात मदत करण्यासाठी एक साधन आहे आणि सर्व वैद्यकीय निर्णय आपली व्यावसायिक जबाबदारी राहतात.'
            },
            {
              title: '9. नुकसानभरपाई',
              content: 'आपल्या सेवेच्या वापरामुळे किंवा या अटींच्या उल्लंघनाशी संबंधित किंवा त्यातून उद्भवणाऱ्या कोणत्याही दावे, दायित्वे, नुकसान, हानी आणि खर्चांपासून डॉक प्रेस्क्रिप आणि त्याचे अधिकारी, संचालक, कर्मचारी आणि एजंट्सची नुकसानभरपाई, बचाव आणि हानिरहित ठेवण्यास आपण सहमती देता.'
            },
            {
              title: '10. समाप्ती',
              content: 'या अटींच्या उल्लंघनासह कोणत्याही कारणास्तव आम्ही तुमचे खाते आणि सेवेचा प्रवेश तात्काळ, पूर्व सूचना किंवा दायित्वाशिवाय संपुष्टात आणू किंवा निलंबित करू शकतो. समाप्तीनंतर, सेवा वापरण्याचा आपला अधिकार तात्काळ बंद होईल.'
            },
            {
              title: '11. अटींमध्ये बदल',
              content: 'आम्ही कोणत्याही वेळी या अटी सुधारण्याचा किंवा बदलण्याचा अधिकार राखून ठेवतो. जर एखादी सुधारणा महत्वाची असेल, तर कोणत्याही नवीन अटी प्रभावी होण्यापूर्वी आम्ही किमान 30 दिवसांची नोटीस देऊ. अशा सुधारणांनंतर सेवेचा आपला निरंतर वापर अद्यतनित अटींच्या स्वीकृतीचे प्रतिनिधित्व करते.'
            },
            {
              title: '12. शासक कायदा',
              content: 'या अटी भारताच्या कायद्यांच्या अधीन राहून आणि त्यानुसार स्पष्ट केल्या जातील, कायद्याच्या संघर्ष तरतुदींकडे दुर्लक्ष करून. या अटींतर्गत उद्भवणारे कोणतेही विवाद महाराष्ट्र, भारतातील न्यायालयांच्या अनन्य न्यायाधिकारांच्या अधीन असतील.'
            },
            {
              title: '13. संपर्क माहिती',
              content: 'या सेवा अटींबद्दल आपल्याकडे कोणतेही प्रश्न असल्यास, कृपया अनुप्रयोगाच्या सहाय्य चॅनेल किंवा फीडबॅक सिस्टमद्वारे आमच्याशी संपर्क साधा.'
            }
          ]
        };
      case 'hindi':
        return {
          title: 'सेवा की शर्तें',
          effectiveDate: 'प्रभावी दिनांक:',
          sections: [
            {
              title: '1. शर्तों की स्वीकृति',
              content: 'डॉक प्रेस्क्रिप ("सेवा") का उपयोग करके, आप इन सेवा की शर्तों ("शर्तें") से बाध्य होने के लिए सहमत हैं। यदि आप इन शर्तों से सहमत नहीं हैं, तो आप सेवा का उपयोग नहीं कर सकते। ये शर्तें सेवा के सभी उपयोगकर्ताओं पर लागू होती हैं, जिसमें स्वास्थ्य पेशेवर, चिकित्सा व्यावसायिक और उनके अधिकृत कर्मचारी शामिल हैं।'
            },
            {
              title: '2. सेवा का विवरण',
              content: 'डॉक प्रेस्क्रिप एक व्यापक चिकित्सा अभ्यास प्रबंधन प्रणाली है जो स्वास्थ्य पेशेवरों को रोगी रिकॉर्ड प्रबंधित करने, प्रिस्क्रिप्शन बनाने, चिकित्सा प्रमाण पत्र तैयार करने, बिलिंग ट्रैक करने और अपने अभ्यास संचालन को सुव्यवस्थित करने में मदद करने के लिए डिज़ाइन की गई है। सेवा में निम्नलिखित शामिल हैं लेकिन इन्हीं तक सीमित नहीं है: रोगी रिकॉर्ड प्रबंधन और चिकित्सा इतिहास ट्रैकिंग, डिजिटल प्रिस्क्रिप्शन निर्माण और प्रबंधन, चिकित्सा प्रमाण पत्र निर्माण, बिलिंग और भुगतान ट्रैकिंग, अपॉइंटमेंट शेड्यूलिंग और फॉलो-अप प्रबंधन, प्रिस्क्रिप्शन टेम्प्लेट्स और चिकित्सा डेटा संगठन, PDF निर्माण और साझाकरण क्षमताएं।'
            },
            {
              title: '3. उपयोगकर्ता पात्रता और पंजीकरण',
              content: 'डॉक प्रेस्क्रिप का उपयोग करने के लिए, आपको होना चाहिए: लाइसेंसप्राप्त चिकित्सा व्यावसायिक या स्वास्थ्य पेशेवर, लाइसेंसप्राप्त चिकित्सा व्यावसायिक की देखरेख में काम करने वाले अधिकृत कर्मचारी, कम से कम 18 वर्ष की आयु के, बाध्यकारी समझौते में प्रवेश करने के लिए कानूनी रूप से सक्षम। आप पंजीकरण के दौरान सटीक, वर्तमान और पूर्ण जानकारी प्रदान करने और ऐसी जानकारी को सटीक, वर्तमान और पूर्ण रखने के लिए अपडेट करने के लिए सहमत हैं।'
            },
            {
              title: '4. व्यावसायिक जिम्मेदारी',
              content: 'इस सेवा का उपयोग करने वाले स्वास्थ्य पेशेवर के रूप में, आप स्वीकार करते हैं और सहमत हैं कि: सेवा के माध्यम से किए गए सभी चिकित्सा निर्णयों और प्रिस्क्रिप्शन की एकमात्र जिम्मेदारी आप पर है, आपको सभी लागू चिकित्सा नियमों और व्यावसायिक मानकों का पालन करना होगा, उपचार निर्णय लेने से पहले आप सभी रोगी जानकारी और चिकित्सा डेटा की पुष्टि करेंगे, आप उपयुक्त व्यावसायिक लाइसेंसिंग और प्रमाणन बनाए रखेंगे, आप रोगी गोपनीयता और चिकित्सा रिकॉर्ड रखने के संबंध में सभी लागू कानूनों का पालन करेंगे।'
            },
            {
              title: '5. डेटा सुरक्षा और गोपनीयता',
              content: 'हम डेटा सुरक्षा को गंभीरता से लेते हैं और आपके डेटा और रोगी जानकारी की सुरक्षा के लिए उपयुक्त तकनीकी और संगठनात्मक उपाय लागू करते हैं। हालांकि, आप स्वीकार करते हैं कि: आपके लॉगिन क्रेडेंशियल की गोपनीयता बनाए रखने की जिम्मेदारी आप पर है, सेवा का उपयोग समाप्त करने पर आपको अपने खाते से लॉग आउट करना होगा, आपको अनधिकृत व्यक्तियों के साथ अपने खाते का एक्सेस साझा नहीं करना चाहिए, किसी भी संदिग्ध सुरक्षा उल्लंघन की तुरंत रिपोर्ट करनी होगी।'
            },
            {
              title: '6. स्वीकार्य उपयोग',
              content: 'आप सेवा का उपयोग केवल कानूनी उद्देश्यों के लिए और इन शर्तों के अनुसार करने के लिए सहमत हैं। आप सहमत हैं कि आप: किसी भी अवैध या अनधिकृत उद्देश्य के लिए सेवा का उपयोग नहीं करेंगे, किसी भी लागू कानून या नियमों का उल्लंघन नहीं करेंगे, सेवा या सेवा से जुड़े सर्वर में हस्तक्षेप या बाधा नहीं डालेंगे, सेवा के किसी भी हिस्से तक अनधिकृत पहुंच प्राप्त करने का प्रयास नहीं करेंगे, कोई हानिकारक या दुर्भावनापूर्ण कोड प्रसारित करने के लिए सेवा का उपयोग नहीं करेंगे, अनधिकृत तीसरे पक्ष के साथ रोगी डेटा साझा नहीं करेंगे।'
            },
            {
              title: '7. बौद्धिक संपदा',
              content: 'सेवा और इसकी मूल सामग्री, सुविधाएं और कार्यक्षमता डॉक प्रेस्क्रिप के स्वामित्व में हैं और अंतर्राष्ट्रीय कॉपीराइट, ट्रेडमार्क, पेटेंट, व्यापार रहस्य और अन्य बौद्धिक संपदा कानूनों द्वारा संरक्षित हैं। आप सेवा में इनपुट किए गए चिकित्सा डेटा और रोगी जानकारी के स्वामित्व को बनाए रखते हैं।'
            },
            {
              title: '8. दायित्व की सीमा',
              content: 'लागू कानून द्वारा अनुमतित अधिकतम सीमा तक, डॉक प्रेस्क्रिप किसी भी अप्रत्यक्ष, आकस्मिक, विशेष, परिणामी या दंडात्मक क्षति, या प्रत्यक्ष या अप्रत्यक्ष रूप से हुई लाभ या राजस्व की हानि, या डेटा, उपयोग, सद्भावना या अन्य अमूर्त हानियों के लिए उत्तरदायी नहीं होगा। आप स्वीकार करते हैं कि सेवा चिकित्सा अभ्यास प्रबंधन में सहायता के लिए एक उपकरण है और सभी चिकित्सा निर्णय आपकी व्यावसायिक जिम्मेदारी बने रहते हैं।'
            },
            {
              title: '9. क्षतिपूर्ति',
              content: 'आप डॉक प्रेस्क्रिप और इसके अधिकारियों, निदेशकों, कर्मचारियों और एजेंटों को आपकी सेवा के उपयोग या इन शर्तों के उल्लंघन से उत्पन्न या संबंधित किसी भी दावे, दायित्व, क्षति, हानि और खर्चों से क्षतिपूर्ति, बचाव और हानिरहित रखने के लिए सहमत हैं।'
            },
            {
              title: '10. समाप्ति',
              content: 'हम इन शर्तों के उल्लंघन सहित किसी भी कारण से आपके खाते और सेवा तक पहुंच को तुरंत, बिना पूर्व सूचना या दायित्व के समाप्त या निलंबित कर सकते हैं। समाप्ति पर, सेवा का उपयोग करने का आपका अधिकार तुरंत समाप्त हो जाएगा।'
            },
            {
              title: '11. शर्तों में परिवर्तन',
              content: 'हम किसी भी समय इन शर्तों को संशोधित या बदलने का अधिकार सुरक्षित रखते हैं। यदि कोई संशोधन महत्वपूर्ण है, तो हम किसी भी नई शर्तों के प्रभावी होने से पहले कम से कम 30 दिनों की सूचना प्रदान करेंगे। ऐसे संशोधनों के बाद सेवा का आपका निरंतर उपयोग अद्यतन शर्तों की स्वीकृति का प्रतिनिधित्व करता है।'
            },
            {
              title: '12. शासी कानून',
              content: 'ये शर्तें भारत के कानूनों के अनुसार शासित और व्याख्या की जाएंगी, कानून के संघर्ष प्रावधानों की परवाह किए बिना। इन शर्तों के तहत उत्पन्न होने वाले कोई भी विवाद महाराष्ट्र, भारत में स्थित न्यायालयों के विशेष न्यायाधिकार के अधीन होंगे।'
            },
            {
              title: '13. संपर्क जानकारी',
              content: 'यदि इन सेवा की शर्तों के बारे में आपके कोई प्रश्न हैं, तो कृपया एप्लिकेशन के सहायता चैनल या फीडबैक सिस्टम के माध्यम से हमसे संपर्क करें।'
            }
          ]
        };
      case 'spanish':
        return {
          title: 'Términos de Servicio',
          effectiveDate: 'Fecha efectiva:',
          sections: [
            {
              title: '1. Aceptación de Términos',
              content: 'Al acceder y usar Doc Prescrip ("el Servicio"), usted acepta estar sujeto a estos Términos de Servicio ("Términos"). Si no está de acuerdo con estos Términos, no puede usar el Servicio. Estos Términos se aplican a todos los usuarios del Servicio, incluyendo profesionales de la salud, médicos y su personal autorizado.'
            },
            {
              title: '2. Descripción del Servicio',
              content: 'Doc Prescrip es un sistema integral de gestión de práctica médica diseñado para ayudar a los profesionales de la salud a gestionar registros de pacientes, crear prescripciones, generar certificados médicos, rastrear facturación y optimizar sus operaciones de práctica. El Servicio incluye pero no se limita a: Gestión de registros de pacientes y seguimiento de historial médico, Creación y gestión de prescripciones digitales, Generación de certificados médicos, Seguimiento de facturación y pagos, Programación de citas y gestión de seguimiento, Plantillas de prescripción y organización de datos médicos, Capacidades de generación y compartición de PDF.'
            },
            {
              title: '3. Elegibilidad de Usuario y Registro',
              content: 'Para usar Doc Prescrip, usted debe ser: Un médico licenciado o profesional de la salud, Personal autorizado trabajando bajo la supervisión de un médico licenciado, Al menos 18 años de edad, Legalmente capaz de entrar en acuerdos vinculantes. Usted acepta proporcionar información precisa, actual y completa durante el registro y actualizar dicha información para mantenerla precisa, actual y completa.'
            },
            {
              title: '4. Responsabilidad Profesional',
              content: 'Como profesional de la salud usando este Servicio, usted reconoce y acepta que: Usted es únicamente responsable de todas las decisiones médicas y prescripciones hechas a través del Servicio, Debe cumplir con todas las regulaciones médicas aplicables y estándares profesionales, Verificará toda la información del paciente y datos médicos antes de tomar decisiones de tratamiento, Mantendrá las licencias profesionales apropiadas y certificaciones, Seguirá todas las leyes aplicables con respecto a la privacidad del paciente y mantenimiento de registros médicos.'
            },
            {
              title: '5. Seguridad de Datos y Privacidad',
              content: 'Tomamos la seguridad de datos en serio e implementamos medidas técnicas y organizacionales apropiadas para proteger sus datos e información de pacientes. Sin embargo, usted reconoce que: Es responsable de mantener la confidencialidad de sus credenciales de inicio de sesión, Debe cerrar sesión de su cuenta cuando termine de usar el Servicio, No debe compartir el acceso a su cuenta con individuos no autorizados, Debe reportar cualquier brecha de seguridad sospechada inmediatamente.'
            },
            {
              title: '6. Uso Aceptable',
              content: 'Usted acepta usar el Servicio solo para propósitos legales y de acuerdo con estos Términos. Usted acepta no: Usar el Servicio para cualquier propósito ilegal o no autorizado, Violar cualquier ley o regulación aplicable, Interferir con o interrumpir el Servicio o servidores conectados al Servicio, Intentar obtener acceso no autorizado a cualquier porción del Servicio, Usar el Servicio para transmitir cualquier código dañino o malicioso, Compartir datos de pacientes con terceros no autorizados.'
            },
            {
              title: '7. Propiedad Intelectual',
              content: 'El Servicio y su contenido original, características y funcionalidad son propiedad de Doc Prescrip y están protegidos por leyes internacionales de derechos de autor, marca registrada, patente, secreto comercial y otras leyes de propiedad intelectual. Usted mantiene la propiedad de los datos médicos e información de pacientes que ingresa en el Servicio.'
            },
            {
              title: '8. Limitación de Responsabilidad',
              content: 'HASTA EL MÁXIMO PERMITIDO POR LA LEY APLICABLE, DOC PRESCRIP NO SERÁ RESPONSABLE POR CUALQUIER DAÑO INDIRECTO, INCIDENTAL, ESPECIAL, CONSECUENCIAL O PUNITIVO, O CUALQUIER PÉRDIDA DE GANANCIAS O INGRESOS, YA SEA INCURRIDA DIRECTA O INDIRECTAMENTE, O CUALQUIER PÉRDIDA DE DATOS, USO, BUENA VOLUNTAD, U OTRAS PÉRDIDAS INTANGIBLES. Usted reconoce que el Servicio es una herramienta para asistir en la gestión de práctica médica y que todas las decisiones médicas siguen siendo su responsabilidad profesional.'
            },
            {
              title: '9. Indemnización',
              content: 'Usted acepta indemnizar, defender y mantener libre de daño a Doc Prescrip y sus oficiales, directores, empleados y agentes de y contra cualquier reclamo, responsabilidad, daño, pérdida y gasto que surja de o esté conectado de cualquier manera con su uso del Servicio o violación de estos Términos.'
            },
            {
              title: '10. Terminación',
              content: 'Podemos terminar o suspender su cuenta y acceso al Servicio inmediatamente, sin previo aviso o responsabilidad, por cualquier razón, incluyendo el incumplimiento de estos Términos. Al terminar, su derecho a usar el Servicio cesará inmediatamente.'
            },
            {
              title: '11. Cambios a los Términos',
              content: 'Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, proporcionaremos al menos 30 días de aviso antes de que cualquier término nuevo tome efecto. Su uso continuado del Servicio después de tales modificaciones constituye aceptación de los Términos actualizados.'
            },
            {
              title: '12. Ley Aplicable',
              content: 'Estos Términos se regirán e interpretarán de acuerdo con las leyes de India, sin consideración a sus disposiciones de conflicto de leyes. Cualquier disputa que surja bajo estos Términos estará sujeta a la jurisdicción exclusiva de los tribunales ubicados en Maharashtra, India.'
            },
            {
              title: '13. Información de Contacto',
              content: 'Si tiene alguna pregunta sobre estos Términos de Servicio, por favor contáctenos a través de los canales de soporte de la aplicación o sistema de retroalimentación.'
            }
          ]
        };
      case 'chinese':
        return {
          title: '服务条款',
          effectiveDate: '生效日期：',
          sections: [
            {
              title: '1. 条款接受',
              content: '通过访问和使用 Doc Prescrip（"服务"），您同意受这些服务条款（"条款"）的约束。如果您不同意这些条款，您不得使用该服务。这些条款适用于服务的所有用户，包括医疗保健专业人员、医疗从业者及其授权工作人员。'
            },
            {
              title: '2. 服务描述',
              content: 'Doc Prescrip 是一个综合的医疗实践管理系统，旨在帮助医疗保健专业人员管理患者记录、创建处方、生成医疗证书、跟踪账单并简化其实践操作。服务包括但不限于：患者记录管理和病史跟踪，数字处方创建和管理，医疗证书生成，账单和付款跟踪，预约安排和随访管理，处方模板和医疗数据组织，PDF 生成和共享功能。'
            },
            {
              title: '3. 用户资格和注册',
              content: '要使用 Doc Prescrip，您必须是：执业医师或医疗保健专业人员，在执业医师监督下工作的授权工作人员，至少 18 岁，具有法律能力签订具有约束力的协议。您同意在注册期间提供准确、最新和完整的信息，并更新此类信息以保持其准确、最新和完整。'
            },
            {
              title: '4. 专业责任',
              content: '作为使用此服务的医疗保健专业人员，您承认并同意：您对通过服务做出的所有医疗决定和处方负全部责任，您必须遵守所有适用的医疗法规和专业标准，您将在做出治疗决定之前验证所有患者信息和医疗数据，您将维持适当的专业执照和认证，您将遵循有关患者隐私和医疗记录保存的所有适用法律。'
            },
            {
              title: '5. 数据安全和隐私',
              content: '我们认真对待数据安全，并实施适当的技术和组织措施来保护您的数据和患者信息。但是，您承认：您有责任维护登录凭据的机密性，您必须在使用完服务后从账户注销，您不应与未经授权的个人共享账户访问权限，您必须立即报告任何可疑的安全漏洞。'
            },
            {
              title: '6. 可接受使用',
              content: '您同意仅出于合法目的并根据这些条款使用服务。您同意不：将服务用于任何非法或未经授权的目的，违反任何适用的法律或法规，干扰或中断服务或连接到服务的服务器，尝试获得对服务任何部分的未经授权访问，使用服务传输任何有害或恶意代码，与未经授权的第三方共享患者数据。'
            },
            {
              title: '7. 知识产权',
              content: '服务及其原创内容、功能和功能由 Doc Prescrip 拥有，并受国际版权、商标、专利、商业秘密和其他知识产权法保护。您保留对输入服务的医疗数据和患者信息的所有权。'
            },
            {
              title: '8. 责任限制',
              content: '在适用法律允许的最大范围内，DOC PRESCRIP 不承担任何间接、偶然、特殊、后果性或惩罚性损害，或任何利润或收入损失（无论是直接还是间接产生的），或任何数据、使用、商誉或其他无形损失的责任。您承认服务是协助医疗实践管理的工具，所有医疗决定仍然是您的专业责任。'
            },
            {
              title: '9. 赔偿',
              content: '您同意赔偿、为 Doc Prescrip 及其高级职员、董事、员工和代理人进行辩护并使其免受因您使用服务或违反这些条款而产生或以任何方式相关的任何索赔、责任、损害、损失和费用的损害。'
            },
            {
              title: '10. 终止',
              content: '我们可能因任何原因（包括违反这些条款）立即终止或暂停您的账户和对服务的访问，无需事先通知或承担责任。终止后，您使用服务的权利将立即停止。'
            },
            {
              title: '11. 条款变更',
              content: '我们保留随时修改或替换这些条款的权利。如果修订是重大的，我们将在任何新条款生效前至少提前 30 天通知。在此类修改后您继续使用服务构成对更新条款的接受。'
            },
            {
              title: '12. 适用法律',
              content: '这些条款将受印度法律管辖并据此解释，不考虑其法律冲突规定。这些条款下产生的任何争议将受位于印度马哈拉施特拉邦的法院的专属管辖。'
            },
            {
              title: '13. 联系信息',
              content: '如果您对这些服务条款有任何疑问，请通过应用程序的支持渠道或反馈系统与我们联系。'
            }
          ]
        };
      default: // English
        return {
          title: 'Terms of Service',
          effectiveDate: 'Effective date:',
          sections: [
            {
              title: '1. Acceptance of Terms',
              content: 'By accessing and using Doc Prescrip ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms apply to all users of the Service, including healthcare professionals, medical practitioners, and their authorized staff.'
            },
            {
              title: '2. Description of Service',
              content: 'Doc Prescrip is a comprehensive medical practice management system designed to help healthcare professionals manage patient records, create prescriptions, generate medical certificates, track billing, and streamline their practice operations. The Service includes but is not limited to: Patient record management and medical history tracking, Digital prescription creation and management, Medical certificate generation, Billing and payment tracking, Appointment scheduling and follow-up management, Prescription templates and medical data organization, PDF generation and sharing capabilities.'
            },
            {
              title: '3. User Eligibility and Registration',
              content: 'To use Doc Prescrip, you must be: A licensed medical practitioner or healthcare professional, Authorized staff working under the supervision of a licensed medical practitioner, At least 18 years of age, Legally capable of entering into binding agreements. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.'
            },
            {
              title: '4. Professional Responsibility',
              content: 'As a healthcare professional using this Service, you acknowledge and agree that: You are solely responsible for all medical decisions and prescriptions made through the Service, You must comply with all applicable medical regulations and professional standards, You will verify all patient information and medical data before making treatment decisions, You will maintain appropriate professional licensing and certifications, You will follow all applicable laws regarding patient privacy and medical record keeping.'
            },
            {
              title: '5. Data Security and Privacy',
              content: 'We take data security seriously and implement appropriate technical and organizational measures to protect your data and patient information. However, you acknowledge that: You are responsible for maintaining the confidentiality of your login credentials, You must log out of your account when finished using the Service, You should not share your account access with unauthorized individuals, You must report any suspected security breaches immediately.'
            },
            {
              title: '6. Acceptable Use',
              content: 'You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to: Use the Service for any illegal or unauthorized purpose, Violate any applicable laws or regulations, Interfere with or disrupt the Service or servers connected to the Service, Attempt to gain unauthorized access to any portion of the Service, Use the Service to transmit any harmful or malicious code, Share patient data with unauthorized third parties.'
            },
            {
              title: '7. Intellectual Property',
              content: 'The Service and its original content, features, and functionality are owned by Doc Prescrip and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You retain ownership of the medical data and patient information you input into the Service.'
            },
            {
              title: '8. Limitation of Liability',
              content: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DOC PRESCRIP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES. You acknowledge that the Service is a tool to assist in medical practice management and that all medical decisions remain your professional responsibility.'
            },
            {
              title: '9. Indemnification',
              content: 'You agree to indemnify, defend, and hold harmless Doc Prescrip and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your use of the Service or violation of these Terms.'
            },
            {
              title: '10. Termination',
              content: 'We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.'
            },
            {
              title: '11. Changes to Terms',
              content: 'We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days\' notice prior to any new terms taking effect. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.'
            },
            {
              title: '12. Governing Law',
              content: 'These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Maharashtra, India.'
            },
            {
              title: '13. Contact Information',
              content: 'If you have any questions about these Terms of Service, please contact us through the application\'s support channels or feedback system.'
            }
          ]
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header with Logo and Language Selector */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center space-x-3">
              <DocPill className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Doc Prescrip</h1>
            </div>
          </div>
          <div className="w-48">
            <CustomDropdown
              options={languageOptions}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              placeholder="Select Language"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {content.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {content.effectiveDate} {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            {content.sections.map((section, index) => (
              <section key={index}>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {section.title}
                </h3>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {section.content.includes('•') ? (
                    // Handle bullet points
                    <div>
                      {section.content.split('•').map((part, idx) => {
                        if (idx === 0) return <p key={idx} className="mb-4">{part}</p>;
                        return (
                          <div key={idx} className="flex items-start space-x-2 mb-2">
                            <span className="text-blue-600 dark:text-blue-400 mt-2">•</span>
                            <span>{part.trim()}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p>{section.content}</p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              By using Doc Prescrip, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}