<div class="mainContent" style="width: 100%">
    <div class="mainside">
        <div class="sectionTitle">ICS Publications</div>
        <div id="content">

            <p>
                <?php if($title): ?><span class="titlePaper">
                    <?php print $title; ?></span>
                <?php endif; ?>
            </p>
        </div>
    </div>
    <div class="mainContentLines">
        <div class="mainside">
            <div id="boxContainer">
                <div class="inner" style="border-top: none; border-left: none; width: 25%;">
                    <div class="textNumbers">
                        <?php if(isset($pub_info['year'])): ?>
                        <div class="element">
                            <p><?php print $pub_info['year'] ?><br>
                        </div>
                        <?php endif;?>

                        <div class="element">
                            <p>English<br>
                        </div>
                        
                        <?php if(isset($pub_info['type']['label'])): ?>
                        <div class="element">
                            <p><strong>CATEGORY</strong>
                                <p><?php print $pub_info['type']['label']?></p>
                        </div>
<?php endif;?>
                        <?php if(isset($pub_info['contributors'])): 
                            for ($i = 0; $i < count($pub_info['contributors']); $i++):
                                if(count($pub_info['contributors'][$i]['persons']) > 0): ?>
                        <div class="element">
                            <p><strong><?php print strtoupper($pub_info['contributors'][$i]['label']) ?></strong>
                                <p>
                                <?php  
                                $indexes = array_keys($pub_info['contributors'][$i]['persons']);
                                sort($indexes);
                                for($j = 0; $j < count($indexes); $j++):
                                    $index = $indexes[$j];?>
                                    <?php 
                                    $full_name = $pub_info['contributors'][$i]['persons'][$index]['givenName'] . ' ' . $pub_info['contributors'][$i]['persons'][$index]['familyName'];
                                    print l($full_name, 'publication/search-pub', array(
                                        'attributes' => array('target' => '_blank'),
                                        'query' => array(
                                            'reviewed' => 'false',
                                            'method' => 'advanced',
                                            'authors0' => $pub_info['contributors'][$i]['persons'][$index]['uri'],
                                    ))); ?><br/>
                                    
                                <?php
                                endfor;
                                ?>
                        </div>
                        <?php
                        endif;
                        endfor;
                        endif;
                        ?>
                        <?php if(isset($pub_info['tag']) && !empty($pub_info['tag'])): 
                            $tag_count = count($pub_info['tag'])?>
                        <div class="element">
                            <p><strong>TOPICS</strong></p>
                            <p>
                            <?php foreach ($pub_info['tag'] as $key => $tag):
                                print l('#'. $tag, 'publication/search-pub', array(
                                    'attributes' => array('target' => '_blank'),
                                    'query' => array(
                                        'reviewed' => 'false',
                                        'method' => 'advanced',
                                        'tags0' => $tag,
                                    )
                                ));
                                if ($key < $tag_count - 1) print " | ";
                            endforeach;?>
                        </p>
                        </div>
                        <?php 
                        endif;
                        ?>

                        <?php if(isset($pub_info['org']) && !empty($pub_info['org'])): ?>
                        <div class="element" style="<?php if(!isset($pub_info['project']) || empty($pub_info['project'])) print "border: none;" ?>">
                            <p><strong>ORGANIZATION</strong></p>
                                <p>
                                    <?php foreach ($pub_info['org'] as $key => $org): 
                                    print l($org['name'], 'publication/search-pub', array(
                                        'attributes' => array('target' => '_blank'),
                                        'query' => array(
                                            'reviewed' => 'false',
                                            'method' => 'advanced',
                                            'orgs0' => $org['name'],
                                        )
                                    ));?><br/>
                                    <?php endforeach; ?>
                                </p>
                        </div>
                    <?php endif; ?>
                        <?php if(isset($pub_info['project']) && !empty($pub_info['project'])): ?>
                        <div class="element" style="border: none;">
                            <p><strong>PROJECT</strong></p>
                                <p>
                                    <?php foreach($pub_info['project'] as $key => $project): ?>
                                    <a href="#" target="_blank"><?php print $project['name'] ?></a><br/>
                    <?php endforeach; ?>
                                </p>
                        </div>
                    <?php endif; ?>
                    </div>
                </div>
                <div>
                    <!--<div class="citation">
        <div class="publicName"><a href="#">Baryannis, G., Kritikos, K., & Plexousakis, D. (2017). A specification-based QoS-aware design framework for service-based applications. Service Oriented Computing and Applications, 11(3), 301-314.</a></div>
        </div> -->
                    <!--<div class="photoPublic">
        <div class="image"><img src="_img/11761_2017_210_Fig1_HTML.gif" alt="Service Oriented Computing and Applications"></div>
        </div> -->
                    <div class="inner" style="border-top: none; width: 75%;">
                        <div class="textNumbers">
                            <!-- <div class="citation">Baryannis, G., Kritikos, K., & Plexousakis, D. (2017). A
                                specification-based
                                QoS-aware design framework for service-based applications. <em>Service Oriented
                                    Computing and
                                    Applications, 11</em>(3), 301-314.
                            </div> -->
                            <?php if(isset($pub_info['englishAbstract']) && $pub_info['englishAbstract']): ?>
                            <p><span class="titleAbstract">Abstract</span></p>
                            <p><?php print $pub_info['englishAbstract'] ?></p>
                    <?php endif; ?>
                            <?php if(isset($pub_info['greekAbstract']) && $pub_info['greekAbstract']): ?>
                                    <p><span class="titleAbstract">Greek Abstract</span></p>
                                    <p><?php print $pub_info['greekAbstract'] ?></p>
                            <?php endif; ?>
                            <div class="element">
                                <?php if(isset($pub_info['externalLink']) && !empty($pub_info['externalLink'])): ?>
                                <p>Related Content: 
                                    <?php foreach($pub_info['externalLink'] as $key => $link): ?>
                                    <a href="<?php print $link?>" target="_blank">[<?php print $key+1 ?>]</a>
                        <?php endforeach; ?>
                    <?php endif; ?>
                            </div>
                            <div class="element" style="border-bottom: none;">
                                <?php if(isset($pub_info['doi'])): ?>
                                <p><strong>DOI</strong>: <a href="<?php
                                        if (strpos($pub_info['doi'], 'doi.org') === FALSE):
                                            print "https://doi.org/";
                                        endif;
                                        print $pub_info['doi'] 
                                    ?>" target="_blank"><?php print $pub_info['doi'] ?></a></p>
                                <?php endif;
                                    if (isset($pub_info['isbn'])):?>
                                    <p><strong>ISBN</strong>: <?php print $pub_info['isbn']; ?></p>
                                    <?php endif; ?>
                                    <p><a href="#">License</a></p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    <div class="mainsideB"></div>
</div>